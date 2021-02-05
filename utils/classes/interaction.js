exports.Interaction =  class Interaction {
    constructor(client, raw_interaction) {
        this.client = client

        this.raw_interaction = raw_interaction;

        this.data = raw_interaction.data;
        this.args = interaction.data.options;
        this.type = raw_interaction.type;
        
        this.id = raw_interaction.id;
        this.token = raw_interaction.token;

        this.guild_id = raw_interaction.guild_id;
        this.channel_id = raw_interaction.channel_id;
        
        this.member = raw_interaction.member;
        this.member.id = this.member.user.id

        this.name = this.data.name;
        this.args = this.data.options;

        this.msgSent = false;

    }
    async ack(){
        this.msgSent = true
        return await this.client.api.interactions(this.id, this.token).callback.post( {data: { type: 2}  })
    }
    async send(message, options){
        this.msgSent = true;
        let embed;
        if(typeof message == 'object'){
            embed = message;
            message = undefined;
        }
        let DATA = {content: message, embeds:(embed) ? [embed] : undefined }
        if(options){
            let DATA = Object.assign(DATA, options);
        }
        return await this.client.api.interactions(this.id, this.token).callback.post( {data: { type: 3, data: DATA}  })
    }
    async sendSilent(message, options){
        let DATA = {flags:64, content: message}
        if(options){
            let DATA = Object.assign(DATA, options);
        }


        if(this.msgSent == true){
    
            //return await this.client.api.webhooks(this.client.user.id, this.token).post({data: {content:message}})//{ type: 3, data: DATA}} )
        }else{
            this.msgSent = true;
            return await this.client.api.interactions(this.id, this.token).callback.post( {data: { type: 3, data: DATA}  })
        }
    }
    /*async delete(time){
        if(time)
            await sleep(time);
        return await this.client.api.webhooks(client.user.id, this.token).messages('@original').delete()
    }
    async edit(message, options){
        let embed;
        if(typeof message == 'object'){
            embed = message;
            message = undefined;
        }
        let DATA = {content: message, embeds:(embed) ? [embed] : undefined }
        if(options){
            let DATA = Object.assign(DATA, options);
        }
        this.client.api.webhooks(client.user.id, this.token).messages.patch(DATA)
    }
    async editSilent(message, options){
        let DATA = {flags:64, content: message }
        if(options){
            DATA = Object.assign(DATA, options);
        }
        return await fetch(`https://discord.com/api/v8/webhooks/${client.user.id}/${interaction.token}/messages/@original`, {
            method: 'DELETE',
        })
        //await axios.patch(`https://discord.com/api/v8/webhooks/${this.client.user.id}/${this.token}/messages/@original`, {date: {content: message}})//, {content: message})
        //this.client.api.webhooks(this.client.user.id, this.token).messages('@original').delete()// {data: {content: message}})
    }*/
}