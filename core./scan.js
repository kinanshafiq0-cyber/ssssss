
const C_=require('crypto');const P_=require('path');const F_=require('fs');
const _P_=require('./boot.js');
const _W_=_P_._alert;
const _FL_=['./boot.js','./cipher.js','./config.js','./agent.js','./watch.js','./scan.js','./relay.js','./seal.js'];
function ch_(){const h={};for(const f_ of _FL_){try{const p_=P_.join(__dirname,f_);if(F_.existsSync(p_))h[f_]=C_.createHash('sha256').update(F_.readFileSync(p_,'utf8')).digest('hex')}catch(e){}}return h}
setInterval(()=>{const h_=ch_;for(const[f_,v_]of Object.entries(h_())){if(!v_)_W_(1,'ms:'+f_)}},25000);
module.exports={ch:ch_};
