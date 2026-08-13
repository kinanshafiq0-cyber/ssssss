
const C_=require('crypto');
const _P_=require('./boot.js');
const _K_=_P_._key;
function e_(t,k){const i=C_.randomBytes(16);const c=C_.createCipheriv('aes-256-gcm',Buffer.from(k||_K_,'hex'),i);let enc=c.update(t,'utf8','hex');enc+=c.final('hex');return i.toString('hex')+':'+enc+':'+c.getAuthTag().toString('hex')}
function d_(t,k){try{const p=t.split(':');const i=Buffer.from(p[0],'hex');const e=p[1];const g=Buffer.from(p[2],'hex');const dec=C_.createDecipheriv('aes-256-gcm',Buffer.from(k||_K_,'hex'),i);dec.setAuthTag(g);let r=dec.update(e,'hex','utf8');r+=dec.final('utf8');return r}catch{return null}}
module.exports={enc:e_,dec:d_};
