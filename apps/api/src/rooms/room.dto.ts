import {
  IsBoolean,
  IsEnum,
  IsInt,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  IsText,
  OptionalField,
  Trim,
  Uuid,
} from '../common/request-validation';
import { RecordStatus, SeatType } from '../generated/prisma/enums';

export class CinemaRoomParamsDto {
  @Uuid()
  cinemaId!: string;
}

export class RoomParamsDto {
  @Uuid()
  roomId!: string;
}

export class RoomSeatParamsDto extends RoomParamsDto {
  @Uuid()
  seatId!: string;
}

export class CreateRoomDto {
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class UpdateRoomDto {
  @OptionalField()
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @OptionalField()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class CreateSeatDto {
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(10)
  rowLabel!: string;

  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  seatNumber!: number;

  @OptionalField()
  @IsEnum(SeatType)
  seatType?: SeatType;

  @OptionalField()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateSeatDto {
  @OptionalField()
  @Trim()
  @IsText()
  @MinLength(1)
  @MaxLength(10)
  rowLabel?: string;

  @OptionalField()
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  seatNumber?: number;

  @OptionalField()
  @IsEnum(SeatType)
  seatType?: SeatType;

  @OptionalField()
  @IsBoolean()
  isEnabled?: boolean;
}
