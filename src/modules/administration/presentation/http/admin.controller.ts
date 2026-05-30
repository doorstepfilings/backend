import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
  Put,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { successResponse } from '../../../../shared/http/api-response';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { Roles } from '../../../identity/infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../../identity/infrastructure/auth/roles.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import {
  AdminService,
  type AdminCategoryInput,
  type AssignRmInput,
  type AdminServiceInput,
  type UpdateRoleInput,
} from '../../application/admin.service';
import type {
  UpdateApplicationStatusInput,
  UpdateRequestStageInput,
} from '../../../service-operations/application/user-services.service';
import { CreateStageDto } from '../../../stages/presentation/http/dto/create-stage.dto';
import { UpdateStageDto } from '../../../stages/presentation/http/dto/update-stage.dto';
import { AssignWorkflowStageDto } from '../../../workflows/presentation/http/dto/assign-workflow-stage.dto';
import { ReorderWorkflowsDto } from '../../../workflows/presentation/http/dto/reorder-workflows.dto';
import { UpdateWorkflowItemDto } from '../../../workflows/presentation/http/dto/update-workflow-item.dto';
import { ReplaceDefaultWorkflowDto } from '../../../workflows/presentation/http/dto/replace-default-workflow.dto';
import { ApplyDefaultWorkflowDto } from '../../../workflows/presentation/http/dto/apply-default-workflow.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    const stats = await this.adminService.getStats();
    return successResponse(stats);
  }

  @Get('activity')
  async getActivity() {
    const activity = await this.adminService.getActivity();
    return successResponse(activity);
  }

  @Get('users')
  async getUsers(@Query('role') role?: string) {
    const users = await this.adminService.getUsers(role);
    return successResponse(users);
  }

  @Get('rms')
  async getRMs() {
    const rms = await this.adminService.getRMs();
    return successResponse(rms);
  }

  @Get('accountants')
  async getAccountants() {
    const accountants = await this.adminService.getAccountants();
    return successResponse(accountants);
  }

  @Post('users/store')
  async storeUser(@Body() data: any) {
    const user = await this.adminService.storeUser(data);
    return successResponse(user, 'User created successfully');
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteUser(id);
    return successResponse(null, 'User deleted successfully');
  }

  @Post('users/assign-rm')
  async assignRM(@Body() data: AssignRmInput) {
    const user = await this.adminService.assignRM(data);
    return successResponse(user, 'RM assigned successfully');
  }

  @Post('users/assign-accountant')
  async assignAccountant(
    @Body() data: { user_id: number; accountant_id: number | null },
  ) {
    const user = await this.adminService.assignAccountant(
      data.user_id,
      data.accountant_id,
    );
    return successResponse(user, 'Accountant assigned successfully');
  }

  @Post('users/update-role/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRoleInput,
  ) {
    const user = await this.adminService.updateRole(id, data);
    return successResponse(user, 'Role updated successfully');
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.adminService.getCategories();
    return successResponse(categories);
  }

  @Post('categories/store')
  async storeCategory(@Body() data: AdminCategoryInput) {
    const result = await this.adminService.storeCategory(data);
    return successResponse(result, 'Category created successfully');
  }

  @Patch('categories/update/:id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AdminCategoryInput,
  ) {
    const result = await this.adminService.updateCategory(id, data);
    return successResponse(result, 'Category updated successfully');
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteCategory(id);
    return successResponse(null, 'Category deleted successfully');
  }

  @Get('services')
  async getServices() {
    const services = await this.adminService.getServices();
    return successResponse(services);
  }

  @Get('services/:id')
  async getService(@Param('id', ParseIntPipe) id: number) {
    const service = await this.adminService.getService(id);
    return successResponse(service);
  }

  @Post('services/store')
  async storeService(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() data: AdminServiceInput,
  ) {
    const result = await this.adminService.storeService(data, authUser.userId);
    return successResponse(result, 'Service created successfully');
  }

  @Patch('services/update/:id')
  async updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    const result = await this.adminService.updateService(id, data);
    return successResponse(result, 'Service updated successfully');
  }

  @Delete('services/:id')
  async deleteService(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteService(id);
    return successResponse(null, 'Service deleted successfully');
  }

  @Get('stages')
  async listStages() {
    const result = await this.adminService.listStages();
    return successResponse(result);
  }

  @Get('lifecycle-stages')
  async listDefaultStages() {
    const result = await this.adminService.listDefaultStages();
    return successResponse(result);
  }

  @Get('stages/:id')
  async getStage(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.getStage(id);
    return successResponse(result);
  }

  @Post('stages')
  async createStage(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() data: CreateStageDto,
  ) {
    const result = await this.adminService.createStage(
      {
        ...data,
        isActive: data.isActive,
      },
      authUser.userId,
    );
    return successResponse(result, 'Stage created successfully');
  }

  @Put('stages/:id')
  async updateStage(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateStageDto,
  ) {
    const result = await this.adminService.updateStage(
      id,
      {
        ...data,
        isActive: data.isActive,
      },
      authUser.userId,
    );
    return successResponse(result, 'Stage updated successfully');
  }

  @Delete('stages/:id')
  async deleteStage(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.adminService.deleteStage(id, authUser.userId);
    return successResponse(null, 'Stage deleted successfully');
  }

  @Get('workflows/default')
  async listDefaultWorkflow() {
    const result = await this.adminService.listDefaultWorkflow();
    return successResponse(result);
  }

  @Put('workflows/default')
  async replaceDefaultWorkflow(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() data: ReplaceDefaultWorkflowDto,
  ) {
    const result = await this.adminService.replaceDefaultWorkflow(
      data,
      authUser.userId,
    );
    return successResponse(result, 'Default workflow updated successfully');
  }

  @Post('workflows/default/apply')
  async applyDefaultWorkflow(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() data: ApplyDefaultWorkflowDto,
  ) {
    const result = await this.adminService.applyDefaultWorkflow(
      data,
      authUser.userId,
    );
    return successResponse(result, 'Default workflow applied successfully');
  }

  @Get('workflows/:serviceId')
  async listServiceWorkflows(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ) {
    const result = await this.adminService.listServiceWorkflows(serviceId);
    return successResponse(result);
  }

  @Post('workflows/assign')
  async assignWorkflowStage(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() data: AssignWorkflowStageDto,
  ) {
    const result = await this.adminService.assignWorkflowStage(
      data,
      authUser.userId,
    );
    return successResponse(result, 'Workflow stage assigned successfully');
  }

  @Put('workflows/reorder')
  async reorderServiceWorkflows(
    @CurrentAuthUser() authUser: { userId: number },
    @Body() data: ReorderWorkflowsDto,
  ) {
    const result = await this.adminService.reorderServiceWorkflows(
      data,
      authUser.userId,
    );
    return successResponse(result, 'Workflow reordered successfully');
  }

  @Put('workflows/:workflowId')
  async updateServiceWorkflow(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('workflowId', ParseIntPipe) workflowId: number,
    @Body() data: UpdateWorkflowItemDto,
  ) {
    const result = await this.adminService.updateServiceWorkflow(
      workflowId,
      data,
      authUser.userId,
    );
    return successResponse(result, 'Workflow updated successfully');
  }

  @Delete('workflows/:workflowId')
  async deleteServiceWorkflow(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('workflowId', ParseIntPipe) workflowId: number,
  ) {
    await this.adminService.deleteServiceWorkflow(workflowId, authUser.userId);
    return successResponse(null, 'Workflow stage deleted successfully');
  }

  @Get('enquiries')
  async getEnquiries() {
    const enquiries = await this.adminService.getEnquiries();
    return successResponse(enquiries);
  }

  @Post('enquiries/update-status/:id')
  async updateEnquiryStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    const enquiry = await this.adminService.updateEnquiryStatus(id, status);
    return successResponse(enquiry, 'Enquiry status updated successfully');
  }

  @Delete('enquiries/:id')
  async deleteEnquiry(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteEnquiry(id);
    return successResponse(null, 'Enquiry deleted successfully');
  }

  // Service Applications
  @Get('service-applications')
  async getServiceApplications(@Query('status') status?: string) {
    const result = await this.adminService.getAllServiceApplications(status);
    return successResponse(result);
  }

  @Get('service-applications/:id')
  async getServiceApplication(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.getServiceApplication(id);
    return successResponse(result);
  }

  @Post('service-applications/:id/status')
  async updateApplicationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateApplicationStatusInput,
  ) {
    const result = await this.adminService.updateApplicationStatus(id, data);
    return successResponse(result);
  }

  @Patch('service-applications/:id/stage')
  async updateApplicationStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRequestStageInput,
  ) {
    const result = await this.adminService.updateApplicationStage(id, data);
    return successResponse(result, 'Stage updated successfully');
  }

  @Post('service-applications/:id/assign')
  async assignAccountantToService(
    @Param('id', ParseIntPipe) id: number,
    @Body('accountant_id', ParseIntPipe) accountantId: number,
  ) {
    const result = await this.adminService.assignAccountantToService(
      id,
      accountantId,
    );
    return successResponse(result);
  }

  @Patch('service-applications/:id/documents/:docId/status')
  async updateDocumentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @Body() data: { status: 'verified' | 'rejected'; remark?: string },
  ) {
    const result = await this.adminService.updateDocumentStatus(
      id,
      docId,
      data.status,
      data.remark,
    );
    return successResponse(result, `Document ${data.status} successfully`);
  }

  @Post('service-applications/:id/upload-certificate')
  @UseInterceptors(FileInterceptor('certificate'))
  async uploadCertificate(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: { originalname: string } | undefined,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.adminService.updateApplicationStatus(id, {
      status: 'approved',
      certificate_url: `certificates/${id}/${file.originalname}`,
    });
    return successResponse(result);
  }

  @Get('regional-managers/:id/details')
  async getRegionalManagerDetails(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.getRegionalManagerDetails(id);
    return successResponse(result);
  }

  @Get('accountants/:id/details')
  async getAccountantDetails(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.getAccountantDetails(id);
    return successResponse(result);
  }

  @Get('users/:id/details')
  async getUserDetails(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.getUserDetails(id);
    return successResponse(result);
  }
}
