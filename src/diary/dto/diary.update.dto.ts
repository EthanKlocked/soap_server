import { PartialType } from '@nestjs/mapped-types';
import { DiaryCreateDto } from '@src/diary/dto/diary.create.dto';


export class DiaryUpdateDto extends PartialType(DiaryCreateDto) {}