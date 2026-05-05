"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserResource = toUserResource;
function toUserResource(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile_number: user.mobileNumber,
        referral_code: user.referralCode,
        rm_id: user.rmId,
        accountant_id: user.accountantId,
        role: user.role,
        rm_unique_id: user.rmUniqueId,
        accountant_unique_id: user.accountantUniqueId,
        is_mobile_verified: user.isMobileVerified,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        regional_manager: user.regionalManager
            ? {
                id: user.regionalManager.id,
                name: user.regionalManager.name,
                email: user.regionalManager.email,
                mobile_number: user.regionalManager.mobileNumber,
                rm_unique_id: user.regionalManager.rmUniqueId,
            }
            : null,
        accountant: user.accountant
            ? {
                id: user.accountant.id,
                name: user.accountant.name,
                email: user.accountant.email,
                mobile_number: user.accountant.mobileNumber,
                accountant_unique_id: user.accountant.accountantUniqueId,
            }
            : null,
    };
}
//# sourceMappingURL=identity.mapper.js.map