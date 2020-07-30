const utils = require('./utils');


const slo = async (ctx, options) => {
    ctx.logger.debug('Doing slo...');
    const {
        method,
        body,
    } = ctx.request;

    ctx.logger.debug(`receive slo POSt............., ${body.logoutRequest}`);
    if (method === 'POST' && body && body.logoutRequest) {
        try {
            const xml = await utils.xml2JsParseString(body.logoutRequest);
            ctx.logger.debug('Receive slo request... Trying to logout. body=', xml);
            if (xml['samlp:LogoutRequest'] && xml['samlp:LogoutRequest']['samlp:SessionIndex']) {
                ctx.status = 202;
                const ticket = xml['samlp:LogoutRequest']['samlp:SessionIndex'];

                ctx.logger.debug(`slo ticket............., ${ticket}`);

                if(ticket){

                    const result=await ctx.app.sessionStore.get('hik_node_sess:'+ticket);
                    if(result&&result.sessionid){
                        await ctx.app.sessionStore.destroy(result.sessionid);
                        await ctx.app.sessionStore.destroy('hik_node_sess:'+ticket);

                    }else {
                        await ctx.app.sessionStore.destroy('hik_node_sess:'+ticket);
                    }
                    ctx.status = 200;
                }
                return;
            }
        } catch (error) {
            ctx.body = {
                error,
                message: error.message,
            }
            ctx.status = 500;
            return;
        }
       
    }

};

module.exports = slo;