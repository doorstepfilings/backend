-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "mobile_number" VARCHAR(50),
    "is_mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "referral_code" VARCHAR(255),
    "rm_unique_id" VARCHAR(191),
    "accountant_unique_id" VARCHAR(191),
    "rm_id" INTEGER,
    "accountant_id" INTEGER,
    "address" VARCHAR(255),
    "city" VARCHAR(255),
    "state" VARCHAR(255),
    "pincode" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" SERIAL NOT NULL,
    "identifier" VARCHAR(191) NOT NULL,
    "otp" VARCHAR(10) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "service_category_id" INTEGER NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "short_description" TEXT,
    "slug" VARCHAR(191) NOT NULL,
    "link" VARCHAR(255),
    "description" TEXT,
    "long_description" TEXT,
    "features" TEXT,
    "requirements" TEXT,
    "process" TEXT,
    "price" DECIMAL(10,2),
    "pricing_plans" JSONB,
    "gst_percentage" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "service_code" VARCHAR(255),
    "service_type" VARCHAR(255) NOT NULL DEFAULT 'standard',
    "processing_days" INTEGER NOT NULL DEFAULT 7,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "faqs" JSONB,
    "required_documents_list" JSONB,
    "extra_documents" JSONB,
    "admin_notes" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_documents" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "document_name" VARCHAR(255),
    "name" VARCHAR(255),
    "slug" VARCHAR(191),
    "description" TEXT,
    "document_type" VARCHAR(255) NOT NULL DEFAULT 'required',
    "file_type" VARCHAR(255) NOT NULL DEFAULT 'pdf',
    "max_size" INTEGER NOT NULL DEFAULT 5,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "service_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255),
    "service" VARCHAR(255),
    "message" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_services" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "accountant_id" INTEGER,
    "application_unique_id" VARCHAR(191),
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "payment_status" VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    "form_data" JSONB,
    "documents" JSONB,
    "amount" DECIMAL(10,2),
    "notes" TEXT,
    "revision_notes" TEXT,
    "ca_notes" TEXT,
    "update_note" TEXT,
    "rejection_reason" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "certificate_url" VARCHAR(255),
    "submitted_to_ca_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_documents" (
    "id" SERIAL NOT NULL,
    "user_service_id" INTEGER NOT NULL,
    "service_document_id" INTEGER,
    "uploaded_by" INTEGER NOT NULL,
    "source_document_id" INTEGER,
    "document_name" VARCHAR(191),
    "document_type" VARCHAR(255),
    "document_category" VARCHAR(255),
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "file_extension" VARCHAR(50),
    "file_size" BIGINT,
    "mime_type" VARCHAR(100),
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_request_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_service_id" INTEGER,
    "payment_provider_order_id" VARCHAR(191),
    "payment_provider_transaction_id" VARCHAR(191),
    "payment_provider" VARCHAR(255) NOT NULL DEFAULT 'razorpay',
    "payment_provider_status" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "status" VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    "payment_status" VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    "payment_method" VARCHAR(50),
    "order_unique_id" VARCHAR(191),
    "invoice_unique_id" VARCHAR(191),
    "notes" JSONB,
    "refund_id" VARCHAR(255),
    "refund_amount" DECIMAL(10,2),
    "refund_reason" TEXT,
    "refund_status" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "extension" VARCHAR(20),
    "file_path" VARCHAR(191) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "folder" VARCHAR(100) NOT NULL DEFAULT 'general',
    "uploaded_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_rm_unique_id_key" ON "users"("rm_unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_accountant_unique_id_key" ON "users"("accountant_unique_id");

-- CreateIndex
CREATE INDEX "users_role_created_at_idx" ON "users"("role", "created_at");

-- CreateIndex
CREATE INDEX "users_mobile_number_idx" ON "users"("mobile_number");

-- CreateIndex
CREATE INDEX "users_rm_id_role_idx" ON "users"("rm_id", "role");

-- CreateIndex
CREATE INDEX "users_accountant_id_role_idx" ON "users"("accountant_id", "role");

-- CreateIndex
CREATE INDEX "otp_identifier_verified_created_at_idx" ON "otp_verifications"("identifier", "verified", "created_at");

-- CreateIndex
CREATE INDEX "otp_identifier_otp_verified_created_at_idx" ON "otp_verifications"("identifier", "otp", "verified", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");

-- CreateIndex
CREATE INDEX "service_categories_sort_order_name_idx" ON "service_categories"("sort_order", "name");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_category_name_idx" ON "services"("service_category_id", "name");

-- CreateIndex
CREATE INDEX "service_documents_service_sort_order_idx" ON "service_documents"("service_id", "sort_order");

-- CreateIndex
CREATE INDEX "enquiries_created_at_idx" ON "enquiries"("created_at");

-- CreateIndex
CREATE INDEX "enquiries_status_created_at_idx" ON "enquiries"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_services_application_unique_id_key" ON "user_services"("application_unique_id");

-- CreateIndex
CREATE INDEX "user_services_status_idx" ON "user_services"("status");

-- CreateIndex
CREATE INDEX "user_services_payment_status_idx" ON "user_services"("payment_status");

-- CreateIndex
CREATE INDEX "user_services_created_at_idx" ON "user_services"("created_at");

-- CreateIndex
CREATE INDEX "user_services_user_status_idx" ON "user_services"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_services_user_service_status_idx" ON "user_services"("user_id", "service_id", "status");

-- CreateIndex
CREATE INDEX "user_services_user_payment_status_idx" ON "user_services"("user_id", "payment_status");

-- CreateIndex
CREATE INDEX "user_services_service_status_idx" ON "user_services"("service_id", "status");

-- CreateIndex
CREATE INDEX "user_services_accountant_status_idx" ON "user_services"("accountant_id", "status");

-- CreateIndex
CREATE INDEX "user_services_accountant_updated_at_idx" ON "user_services"("accountant_id", "updated_at");

-- CreateIndex
CREATE INDEX "srd_source_document_idx" ON "service_request_documents"("source_document_id");

-- CreateIndex
CREATE INDEX "srd_user_service_created_at_idx" ON "service_request_documents"("user_service_id", "created_at");

-- CreateIndex
CREATE INDEX "srd_uploaded_by_created_at_idx" ON "service_request_documents"("uploaded_by", "created_at");

-- CreateIndex
CREATE INDEX "srd_user_service_service_document_idx" ON "service_request_documents"("user_service_id", "service_document_id");

-- CreateIndex
CREATE INDEX "srd_user_service_doc_name_version_idx" ON "service_request_documents"("user_service_id", "document_name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_provider_order_id_key" ON "payments"("payment_provider_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_provider_transaction_id_key" ON "payments"("payment_provider_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_unique_id_key" ON "payments"("order_unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_unique_id_key" ON "payments"("invoice_unique_id");

-- CreateIndex
CREATE INDEX "payments_user_created_at_idx" ON "payments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_user_status_created_at_idx" ON "payments"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "payments_user_service_status_idx" ON "payments"("user_service_id", "status");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_file_path_key" ON "media_assets"("file_path");

-- CreateIndex
CREATE INDEX "media_assets_folder_created_at_idx" ON "media_assets"("folder", "created_at");

-- CreateIndex
CREATE INDEX "media_assets_uploaded_by_created_at_idx" ON "media_assets"("uploaded_by", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_rm_id_fkey" FOREIGN KEY ("rm_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_documents" ADD CONSTRAINT "service_documents_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_services" ADD CONSTRAINT "user_services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_services" ADD CONSTRAINT "user_services_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_services" ADD CONSTRAINT "user_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_documents" ADD CONSTRAINT "service_request_documents_user_service_id_fkey" FOREIGN KEY ("user_service_id") REFERENCES "user_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_documents" ADD CONSTRAINT "service_request_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_service_id_fkey" FOREIGN KEY ("user_service_id") REFERENCES "user_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
