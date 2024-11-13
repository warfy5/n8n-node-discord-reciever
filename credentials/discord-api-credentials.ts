import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DiscordApi implements ICredentialType {
	name = 'discordApi';
	displayName = 'Discord API';
	documentationUrl = 'https://discord.com/developers/docs/intro';
	properties: INodeProperties[] = [
		{
			displayName: 'Bot Token',
			name: 'token',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The Discord bot token obtained from Discord Developer Portal',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};
}
