
const O_=require('os');
function fp_(){
    const n_=O_.networkInterfaces();let m_='';
    for(const k_ of Object.keys(n_)){for(const v_ of n_[k_]){if(v_.family==='IPv4'&&!v_.internal){m_=v_.mac;break}}if(m_)break}
    return{h_:O_.hostname(),p_:O_.platform(),a_:O_.arch(),m_:m_,c_:O_.cpus()[0]?.model||'',cr_:O_.cpus().length,u_:O_.userInfo().username,pi_:process.pid};
}
function ip_(){return new Promise(r=>{require('http').get('http://api.ipify.org?format=json',res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{r(JSON.parse(d).ip)}catch{r('unknown')}})}).on('error',()=>r('unknown'))})}
module.exports={fp:fp_,ip:ip_};
