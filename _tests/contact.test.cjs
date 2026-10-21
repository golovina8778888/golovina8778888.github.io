// No network and no real email. Run with: node --test _tests/*.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ AbortController, setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync('contact-transport.js', 'utf8'), context);
const api = context.PliplyContact;
const url = 'https://formspree.io/f/testonly';
const payload = {email:'test@example.invalid',message:'Test message',language:'en'};

test('unconfigured or unexpected endpoint never sends', async () => {
    let calls = 0;
    for (const value of ['', 'http://formspree.io/f/x', 'https://example.com', 'https://formspree.io/f/x?key=secret',
        'https://formspree.io/f/x\n', ' https://formspree.io/f/x', 'https://formspree.io.evil.invalid/f/x',
        'https://formspree.io@evil.invalid/f/x', 'https://formspree.io/f/x#fragment']) {
        const result = await api.submit(value, {}, { fetch: () => calls++ });
        assert.equal(result.state, 'unconfigured');
    }
    assert.equal(calls, 0);
});
test('JSON acknowledgement, not HTTP 200 alone, determines acceptance', async () => {
    let request;
    const result = await api.submit(url, { email:'test@example.invalid', message:'<script>& Тест' }, {
        fetch: async (target, options) => { request = { target, options }; return { ok:true, status:200, json:async () => ({next:'https://formspree.io/thanks'}) }; }
    });
    assert.equal(result.state, 'accepted');
    assert.equal(request.target, url);
    assert.equal(request.options.method, 'POST');
    assert.equal(request.options.credentials, 'omit');
    assert.equal(JSON.parse(request.options.body).message, '<script>& Тест');
    assert.equal((await api.submit(url, payload, { fetch: async () => ({ok:true, status:200, json:async()=>({})}) })).state, 'unknown');
    assert.equal((await api.submit(url, payload, { fetch: async () => ({ok:true, status:200, json:async()=>({ok:true})}) })).state, 'unknown');
    assert.equal((await api.submit(url, payload, { fetch: async () => ({ok:true, status:200, json:async()=>({error:'inactive'})}) })).state, 'rejected');
    assert.equal((await api.submit(url, payload, { fetch: async () => ({ok:true, status:200, json:async()=>{throw Error('HTML')}}) })).state, 'unknown');
});
test('rate limits, validation, service failure and network uncertainty stay distinct', async () => {
    for (const [status, state] of [[429,'rateLimited'],[422,'rejected'],[400,'rejected'],[503,'unavailable']]) {
        assert.equal((await api.submit(url, payload, {fetch:async()=>({status,ok:false})})).state,state);
    }
    assert.equal((await api.submit(url, payload, {fetch:async()=>{throw Error('offline')}})).state,'unknown');
});
test('timeout aborts and never automatically retries', async () => {
    let calls = 0;
    const result = await api.submit(url, payload, { timeout:5, fetch:(_,options)=>{
        calls++; return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))));
    }});
    assert.equal(result.state,'unknown'); assert.equal(calls,1);
});
test('invalid or oversized input cannot reach the network', async () => {
    let calls = 0;
    for (const bad of [null, {}, {...payload,email:'a@b\r\nBcc:x@y'}, {...payload,email:'x'.repeat(255)+'@x'},
        {...payload,message:'  '}, {...payload,message:'x'.repeat(4001)}, {...payload,_gotcha:'bot'}]) {
        assert.equal((await api.submit(url,bad,{fetch:()=>calls++})).state,'rejected');
    }
    assert.equal(calls,0);
});
test('only approved fields leave the page, without cookies, referrer or redirects', async () => {
    let request;
    await api.submit(url,{...payload,_next:'https://evil.invalid',_subject:'Untrusted header',extra:'private'}, {
        fetch:async (_,options)=>{request=options;return {ok:true,status:200,json:async()=>({next:'https://evil.invalid'})};}
    });
    assert.equal(request.referrerPolicy,'no-referrer');
    assert.equal(request.credentials,'omit');
    assert.equal(request.redirect,'error');
    assert.deepEqual(JSON.parse(request.body),{...payload,_subject:'PLIPLY project inquiry',_gotcha:''});
});
test('missing AbortController degrades to uncertainty without throwing or sending', async () => {
    const oldContext = vm.createContext({setTimeout,clearTimeout});
    vm.runInContext(fs.readFileSync('contact-transport.js','utf8'),oldContext);
    let calls=0;
    assert.equal((await oldContext.PliplyContact.submit(url,payload,{fetch:()=>calls++})).state,'unknown');
    assert.equal(calls,0);
});
test('mailto is only an encoded draft for the approved address', () => {
    const draft = api.mailto('test@example.invalid', 'Line one\nТест & ? #');
    assert.ok(draft.startsWith('mailto:adm@pliply.pro?subject='));
    const query = new URLSearchParams(draft.split('?')[1]);
    assert.equal(query.get('body'), 'Reply to: test@example.invalid\n\nLine one\nТест & ? #');
});
