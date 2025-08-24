import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../../common/enums/user-role.enum';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({ unique: true, sparse: true })
  username?: string;

  @Prop()
  password?: string;

  @Prop()
  email?: string;

  @Prop({ unique: true, sparse: true })
  deviceId?: string;

  @Prop({ default: false })
  isGuest: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ 
    type: String, 
    enum: UserRole, 
    default: function() {
      return this.isGuest ? UserRole.GUEST : UserRole.USER;
    }
  })
  role: UserRole;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastLoginIp?: string;

  // 游戏相关数据
  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  experience: number;

  @Prop({ default: 0 })
  coins: number;

  @Prop({ default: 0 })
  gems: number;

  @Prop({ default: 0 })
  totalPlayTime: number; // 总游戏时长（分钟）

  @Prop({ default: 0 })
  gamesPlayed: number;

  @Prop({ default: 0 })
  gamesWon: number;

  // 留存数据
  @Prop({ default: 0 })
  daysSinceFirstLogin: number;

  @Prop({ default: 1 })
  totalLoginDays: number;

  @Prop({ default: 1 })
  consecutiveLoginDays: number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);