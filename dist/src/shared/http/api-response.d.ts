export declare function successResponse<T>(data: T, message?: string): {
    success: boolean;
    message: string;
    data: T;
};
