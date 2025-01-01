import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ChatSendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUUID()
  @IsNotEmpty()
  chatroomId: string;
}
