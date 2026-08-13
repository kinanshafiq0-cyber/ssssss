
const P_=require('path');const F_=require('fs');
const _P_=require('./boot.js');
const _W_=_P_._alert;
const _FL_=['./boot.js','./cipher.js','./config.js','./agent.js','./watch.js','./scan.js','./relay.js','./seal.js'];
for(const f_ of _FL_){try{const p_=P_.join(__dirname,f_);if(F_.existsSync(p_))F_.watch(p_,(t_)=>{_W_(1,'wf:'+f_)})}catch(e){}}
module.exports={};
