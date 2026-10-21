// No network and no real email. Run with: node --test _tests/*.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ AbortController, setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync('contact-transport.js', 'utf8'), context);
const api = context.PliplyContact;
const url = 'https://formspree.io/f/testonly';

test('unconfigured or unexpected endpoint never sends', async () => {
    let calls = 0;
    for (const value of ['', 'http://formspree.io/f/x', 'https://example.com', 'https://formspree.io/f/x?key=secret']) {
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
    assert.equal((await api.submit(url, {}, { fetch: async () => ({ok:true, status:200, json:async()=>({})}) })).state, 'unknown');
    assert.equal((await api.submit(url, {}, { fetch: async () => ({ok:true, status:200, json:async()=>({ok:true})}) })).state, 'unknown');
    assert.equal((await api.submit(url, {}, { fetch: async () => ({ok:true, status:200, json:async()=>({error:'inactive'})}) })).state, 'rejected');
    assert.equal((await api.submit(url, {}, { fetch: async () => ({ok:true, status:200, json:async()=>{throw Error('HTML')}}) })).state, 'unknown');
});
test('rate limits, validation, service failure and network uncertainty stay distinct', async () => {
    for (const [status, state] of [[429,'rateLimited'],[422,'rejected'],[400,'rejected'],[503,'unavailable']]) {
        assert.equal((await api.submit(url, {}, {fetch:async()=>({status,ok:false})})).state,state);
    }
    assert.equal((await api.submit(url, {}, {fetch:async()=>{throw Error('offline')}})).state,'unknown');
});
test('timeout aborts and never automatically retries', async () => {
    let calls = 0;
    const result = await api.submit(url, {}, { timeout:5, fetch:(_,options)=>{
        calls++; return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))));
    }});
    assert.equal(result.state,'unknown'); assert.equal(calls,1);
});
test('mailto is only an encoded draft for the approved address', () => {
    const draft = api.mailto('test@example.invalid', 'Line one\nТест & ? #');
    assert.ok(draft.startsWith('mailto:adm@pliply.pro?subject='));
    const query = new URLSearchParams(draft.split('?')[1]);
    assert.equal(query.get('body'), 'Reply to: test@example.invalid\n\nLine one\nТест & ? #');
});
