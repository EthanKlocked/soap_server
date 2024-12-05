import { NestFactory } from '@nestjs/core';
import { AppModule } from '@src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from '@src/transform.interceptor';
import * as cookieParser from 'cookie-parser';
import { setupSwagger } from '@src/config/swagger.config';
import { json, urlencoded } from 'express';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: [
			'http://localhost:5173',
			'http://192.168.35.247:5173',
			'http://192.168.0.55:5173',
			'http://172.30.1.48:5173',
			'https://soaf-web.vercel.app'
		],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		preflightContinue: false,
		optionsSuccessStatus: 204,
		credentials: true,
		allowedHeaders: 'Content-Type, Accept, Authorization, x-access-token, x-refresh-token'
	});

	app.use(json({ limit: '50mb' }));
	app.use(urlencoded({ limit: '50mb', extended: true }));

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true
		})
	);

	app.useGlobalInterceptors(new TransformInterceptor());

	setupSwagger(app);

	app.use(cookieParser());

	await app.listen(3001);
}
bootstrap();
