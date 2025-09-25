import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
	const config = new DocumentBuilder()
		.setTitle('Nest API')
		.setDescription(
			`
### Soap API document made by Ethan Kim

#### 중요: API 인증 요구사항

모든 API 요청에는 다음 헤더가 필요합니다:

\`\`\`
Authorization: Bearer <API_KEY>
\`\`\`

여기서 <API_KEY>는 서버에서 제공하는 비밀 키입니다.

#### 주의사항
- API 키는 절대 공개되어서는 안 됩니다.
- 키는 Bearer 접두사와 함께 사용해야 합니다.
- 유효하지 않은 키를 사용하면 요청이 거부됩니다.
- 보안을 위해 키는 주기적으로 변경될 수 있습니다.

문의사항이나 키 발급 요청은 관리자에게 연락하세요.
			`
		)
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				name: 'API Key',
				description: 'Enter your API key (Bearer prefix will be added automatically)',
				in: 'header'
			},
			'api-key'
		)
		.addApiKey(
			{
				type: 'apiKey',
				name: 'x-access-token',
				in: 'header',
				description: 'JWT Token'
			},
			'x-access-token'
		)
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);
}
