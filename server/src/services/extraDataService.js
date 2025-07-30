import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const extraDataService = {
    getAllExtraData: async () => {
        try {
            const records = await prisma.extraData.findMany();
            return {
                status: 200,
                success: true,
                message: "ExtraData fetched successfully",
                data: records,
            };
        } catch (error) {
            throw new Error("Failed to fetch ExtraData: " + error.message);
        }
    },

    getExtraData: async ({ id, testCaseId, nodeId, userId, roleId, roles }) => {
        try {
            if (!roleId && roles) {
                const role = await prisma.role.findUnique({ where: { name: roles } });
                if (!role) {
                    return {
                        status: 404,
                        success: false,
                        message: `Role with name '${roles}' not found`,
                    };
                }
                roleId = role.id;
            }
            // Nếu truyền id → tìm theo id duy nhất
            if (id) {
                const record = await prisma.extraData.findUnique({
                    where: { id },
                });

                if (!record) {
                    return {
                        status: 404,
                        success: false,
                        message: "ExtraData not found by ID",
                    };
                }

                return {
                    status: 200,
                    success: true,
                    message: "ExtraData found by ID",
                    data: record,
                };
            }
            // Nếu không truyền id → tìm theo các trường khác
            const whereClause = {
                ...(testCaseId && { testCaseId }),
                ...(nodeId && { nodeId }),
                ...(userId && { userId }),
                ...(roleId && { roleId }),
            };

            const records = await prisma.extraData.findMany({
                where: whereClause,
                include: roleId ? { user: true } : undefined,
            });

            if (records.length === 0) {
                return {
                    status: 404,
                    success: false,
                    message: "No ExtraData found for given criteria",
                };
            }

            return {
                status: 200,
                success: true,
                message: "ExtraData fetched successfully",
                data: records,
            };
        } catch (error) {
            throw new Error("Failed to fetch ExtraData: " + error.message);
        }
    },

    createExtraData: async ({ testCaseId, nodeId, userId, roleId, data }) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { roleId: true },
            });

            if (!user) {
                return {
                    status: 404,
                    success: false,
                    message: "User not found",
                };
            }

            const roleId = user.roleId;

            const exists = await prisma.extraData.findFirst({
                where: {
                    testCaseId,
                    nodeId,
                    userId,
                    roleId,
                },
            });

            if (exists) {
                return {
                    status: 409,
                    success: false,
                    message: "ExtraData already exists for this testCaseId, nodeId, userId and roleId",
                };
            }

            // 3. Tạo mới
            const created = await prisma.extraData.create({
                data: { testCaseId, nodeId, userId, roleId, data },
            });

            return {
                status: 201,
                success: true,
                message: "ExtraData created successfully",
                data: created,
            };
        } catch (error) {
            throw new Error("Failed to create ExtraData: " + error.message);
        }
    },

    updateExtraData: async ({ id, testCaseId, nodeId, userId, roleId, data }) => {
        try {
            const existing = await prisma.extraData.findUnique({ where: { id } });
            if (!existing) {
                return { status: 404, success: false, message: "ExtraData not found" };
            }

            const newData = {
                testCaseId: testCaseId ?? existing.testCaseId,
                nodeId: nodeId ?? existing.nodeId,
                userId: userId ?? existing.userId,
                roleId: roleId ?? existing.roleId,
                data: data ?? existing.data,
            };

            const noChange =
                existing.testCaseId === newData.testCaseId &&
                existing.nodeId === newData.nodeId &&
                existing.userId === newData.userId &&
                existing.roleId === newData.roleId &&
                JSON.stringify(existing.data) === JSON.stringify(newData.data);

            if (noChange) {
                return {
                    status: 400,
                    success: false,
                    message: "No fields have been modified. Update aborted.",
                };
            }

            const isKeyChanged = (
                newData.testCaseId !== existing.testCaseId ||
                newData.nodeId !== existing.nodeId ||
                newData.userId !== existing.userId ||
                newData.roleId !== existing.roleId
            );

            if (isKeyChanged) {
                const duplicate = await prisma.extraData.findFirst({
                    where: {
                        testCaseId: newData.testCaseId,
                        nodeId: newData.nodeId,
                        userId: newData.userId,
                        roleId: newData.roleId,
                        NOT: { id },
                    },
                });

                if (duplicate) {
                    return {
                        status: 409,
                        success: false,
                        message: "Another ExtraData with same key already exists",
                    };
                }
            }

            const updated = await prisma.extraData.update({
                where: { id },
                data: newData,
            });

            return {
                status: 200,
                success: true,
                message: "ExtraData updated successfully",
                data: updated,
            };
        } catch (error) {
            throw new Error("Failed to update ExtraData: " + error.message);
        }
    },

    deleteExtraData: async ({ id }) => {
        try {
            await prisma.extraData.delete({
                where: { id }, // id là string, Prisma expect kiểu `where: { id: string }`
            });

            return {
                status: 200,
                success: true,
                message: "ExtraData deleted successfully",
            };
        } catch (error) {
            throw new Error("Failed to delete ExtraData: " + error.message);
        }
    },
};

export default extraDataService;
