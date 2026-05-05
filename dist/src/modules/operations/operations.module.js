"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const enquiry_entity_1 = require("../customer/infrastructure/persistence/enquiry.entity");
const service_entity_1 = require("../catalog/infrastructure/persistence/service.entity");
const user_entity_1 = require("../identity/infrastructure/persistence/user.entity");
const cart_service_1 = require("./application/cart.service");
const user_services_service_1 = require("./application/user-services.service");
const slots_service_1 = require("./application/slots.service");
const user_service_entity_1 = require("./infrastructure/persistence/user-service.entity");
const service_request_document_entity_1 = require("./infrastructure/persistence/service-request-document.entity");
const payment_entity_1 = require("./infrastructure/persistence/payment.entity");
const cart_controller_1 = require("./presentation/http/cart.controller");
const user_services_controller_1 = require("./presentation/http/user-services.controller");
const slots_controller_1 = require("./presentation/http/slots.controller");
const payment_controller_1 = require("./presentation/http/payment.controller");
const payment_service_1 = require("./application/payment.service");
const document_upload_service_1 = require("./application/document-upload.service");
const payment_webhook_controller_1 = require("./presentation/http/payment-webhook.controller");
const user_orders_controller_1 = require("./presentation/http/user-orders.controller");
let OperationsModule = class OperationsModule {
};
exports.OperationsModule = OperationsModule;
exports.OperationsModule = OperationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_service_entity_1.UserServiceEntity,
                service_request_document_entity_1.ServiceRequestDocumentEntity,
                payment_entity_1.PaymentEntity,
                service_entity_1.ServiceEntity,
                user_entity_1.UserEntity,
                enquiry_entity_1.EnquiryEntity,
            ]),
        ],
        controllers: [
            cart_controller_1.CartController,
            user_services_controller_1.UserServicesController,
            slots_controller_1.SlotsController,
            payment_controller_1.PaymentController,
            payment_webhook_controller_1.PaymentWebhookController,
            user_orders_controller_1.UserOrdersController,
        ],
        providers: [
            cart_service_1.CartService,
            user_services_service_1.UserServicesService,
            slots_service_1.SlotsService,
            payment_service_1.PaymentService,
            document_upload_service_1.DocumentUploadService,
        ],
        exports: [
            cart_service_1.CartService,
            user_services_service_1.UserServicesService,
            slots_service_1.SlotsService,
            payment_service_1.PaymentService,
            document_upload_service_1.DocumentUploadService,
        ],
    })
], OperationsModule);
//# sourceMappingURL=operations.module.js.map