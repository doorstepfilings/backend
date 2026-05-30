import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { ProfileService } from '../../application/profile.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentAuthUser } from './current-auth-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConnectRmDto } from './dto/connect-rm.dto';
import { SearchRmDto } from './dto/search-rm.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('public/search-rm')
  async searchRegionalManagerPublic(@Query() query: SearchRmDto) {
    const result = await this.profileService.searchRegionalManager(
      query.rm_unique_id,
    );

    return successResponse(result, 'Relationship Manager  found');
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/search-rm')
  async searchRegionalManagerPrivate(@Query() query: SearchRmDto) {
    const result = await this.profileService.searchRegionalManager(
      query.rm_unique_id,
    );

    return successResponse(result, 'Relationship Manager  found');
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/connect-rm')
  async connectRegionalManager(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() body: ConnectRmDto,
  ) {
    const result = await this.profileService.connectRegionalManager(
      authUser.userId,
      body.rm_unique_id,
    );

    return successResponse(
      result,
      'Connected to Relationship Manager  successfully',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('user/profile')
  async updateProfile(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() body: UpdateProfileDto,
  ) {
    const result = await this.profileService.updateProfile(
      authUser.userId,
      body,
    );

    return successResponse(result, 'Profile updated successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/change-password')
  async changePassword(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() body: ChangePasswordDto,
  ) {
    await this.profileService.changePassword(authUser.userId, body);

    return successResponse(null, 'Password changed successfully');
  }
}
