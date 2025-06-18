import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
	data: T;
	statusCode?: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		currentPage: number;
		itemsPerPage: number;
		totalItems: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

@Injectable()
export class TransformInterceptor<T>
	implements NestInterceptor<T, Response<T> | PaginatedResponse<T>>
{
	intercept(
		context: ExecutionContext,
		next: CallHandler<T>
	):
		| Observable<Response<T> | PaginatedResponse<T>>
		| Promise<Observable<Response<T> | PaginatedResponse<T>>> {
		const ctx = context.switchToHttp();
		const response = ctx.getResponse();
		return next.handle().pipe(
			map(data => {
				// 이미 data와 meta를 포함하는 응답은 그대로 반환
				if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
					return data as PaginatedResponse<T>;
				}
				return {
					data: data,
					statusCode: response.statusCode
				};
			})
		);
	}
}
