import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>>{
	intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> | Promise<Observable<Response<T>>> {
		const ctx = context.switchToHttp();
		const response = ctx.getResponse();        
		return next
		.handle()
		.pipe(map((data) => {
			return { 
				data : data,
				statusCode : response.statusCode
			};
		}));
	}
}