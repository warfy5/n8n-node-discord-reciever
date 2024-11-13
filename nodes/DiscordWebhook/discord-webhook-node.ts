import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { Client, GatewayIntentBits, Events } from 'discord.js';

export class DiscordWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Discord Webhook',
		name: 'discordWebhook',
		icon: 'file:discord.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Starts when Discord messages are received',
		defaults: {
			name: 'Discord Webhook',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'discordApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Receive',
						value: 'receive',
						description: 'Receive messages from a Discord channel',
						action: 'Receive a message',
					},
				],
				default: 'receive',
			},
			{
				displayName: 'Channel ID',
				name: 'channelId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['receive'],
						resource: ['message'],
					},
				},
				description: 'The ID of the Discord channel to receive messages from',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('discordApi');
		const channelId = this.getNodeParameter('channelId', 0) as string;

		if (!credentials?.token) {
			throw new NodeOperationError(this.getNode(), 'No valid token provided!');
		}

		const client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
			],
		});

		return new Promise((resolve, reject) => {
			const returnData: INodeExecutionData[] = [];

			client.once(Events.ClientReady, () => {
				console.log('Connected to Discord');
			});

			client.on(Events.MessageCreate, async (message) => {
				if (message.author.bot) return;
				if (message.channelId !== channelId) return;

				returnData.push({
					json: {
						messageId: message.id,
						content: message.content,
						authorId: message.author.id,
						authorUsername: message.author.username,
						channelId: message.channelId,
						timestamp: message.createdTimestamp,
					},
				});

				resolve([returnData]);
			});

			client.on(Events.Error, (error) => {
				console.error('Discord error:', error);
				reject(error);
			});

			client.login(credentials.token).catch((error) => {
				throw new NodeOperationError(this.getNode(), `Discord login failed: ${error.message}`);
			});
		});
	}
}
