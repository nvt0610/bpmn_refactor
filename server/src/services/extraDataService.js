import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const unwrapData = (record) => {
    if (!record?.data || typeof record.data !== "object") return record;
    const [key] = Object.keys(record.data);
    return {
        ...record,
        [key]: record.data[key],
        data: undefined,
    };
};

const extraDataService = {
    getAllExtraData: async () => {
        const records = await prisma.extraData.findMany();
        return {
            status: 200,
            success: true,
            message: "ExtraData fetched successfully",
            data: records.map(unwrapData),
        };
    },

    getExtraData: async ({ id, testCaseId, nodeId, userId, roleId, roles, dataType, hasField }) => {
        if (id) {
            const record = await prisma.extraData.findUnique({ where: { id } });
            if (!record) return { status: 404, success: false, message: "ExtraData not found by ID" };
            return { status: 200, success: true, message: "ExtraData found by ID", data: unwrapData(record) };
        }

        let testCaseNodeIds = [];
        if (testCaseId) {
            const nodeFilter = nodeId ? { testCaseId, nodeId } : { testCaseId };
            const testCaseNodes = await prisma.testCaseNode.findMany({ where: nodeFilter, select: { id: true } });
            testCaseNodeIds = testCaseNodes.map((n) => n.id);
        }

        let isQC = false;
        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
            if (user?.role?.name === "QC") isQC = true;
        }

        let records = [];
        if (roles) {
            records = await prisma.extraData.findMany({
                where: {
                    user: { role: { name: { in: roles.split(",") } } },
                    ...(testCaseNodeIds.length && { testCaseNodeId: { in: testCaseNodeIds } }),
                },
                include: { user: true },
            });
        } else {
            records = await prisma.extraData.findMany({
                where: {
                    ...(testCaseNodeIds.length && { testCaseNodeId: { in: testCaseNodeIds } }),
                    ...(userId && !isQC ? { userId } : {}),
                    ...(roleId && { roleId }),
                },
                include: roleId ? { user: true } : undefined,
            });
        }

        records = records.filter(
            (r) =>
                (!dataType || (r.data && r.data[dataType])) &&
                (!hasField || (r.data && r.data.hasOwnProperty(hasField)))
        );

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
            data: records.map(unwrapData),
        };
    },

    createExtraData: async ({ testCaseId, userId, data }) => {
        const results = [];
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { roleId: true } });
        if (!user) return { status: 404, success: false, message: "User not found" };
        const roleId = user.roleId;

        const testCaseNodes = await prisma.testCaseNode.findMany({ where: { testCaseId } });
        const nodeMap = new Map(testCaseNodes.map((n) => [n.nodeId, n.id]));

        const existingRecords = await prisma.extraData.findMany({
            where: { userId, roleId, testCaseNodeId: { in: Array.from(nodeMap.values()) } },
        });

        const existingMap = new Map();
        existingRecords.forEach((record) => {
            existingMap.set(record.testCaseNodeId, record);
        });

        for (const item of data) {
            const { nodeId, description, attachments, ...rest } = item;
            const testCaseNodeId = nodeMap.get(nodeId);
            if (!testCaseNodeId) {
                results.push({ status: 404, success: false, message: "Node not found", data: item });
                continue;
            }

            const existing = existingMap.get(testCaseNodeId);
            const dataPayload = Object.keys(rest).length > 0 ? rest : undefined;

            if (existing) {
                const updated = await extraDataService.updateExtraData({
                    id: existing.id,
                    data: dataPayload,
                    description,
                    attachments,
                });
                results.push(updated);
            } else {
                const created = await prisma.extraData.create({
                    data: {
                        testCaseNodeId,
                        userId,
                        roleId,
                        data: dataPayload,
                        ...(description && { description }),
                        ...(attachments && { attachments }),
                    },
                });
                results.push({ status: 201, success: true, message: "Created new", data: unwrapData(created) });
            }
        }

        return {
            status: 207,
            success: true,
            message: "Processed all entries",
            data: results,
        };
    },

    updateExtraData: async ({ id, testCaseId, nodeId, userId, roleId, data, description, attachments }) => {
        const existing = await prisma.extraData.findUnique({ where: { id } });
        if (!existing) return { status: 404, success: false, message: "ExtraData not found" };

        let testCaseNodeId = existing.testCaseNodeId;
        if (testCaseId && nodeId) {
            const node = await prisma.testCaseNode.findUnique({
                where: {
                    testCaseId_nodeId: {
                        testCaseId,
                        nodeId,
                    },
                },
            });
            if (!node) return { status: 404, success: false, message: "TestCaseNode not found" };
            testCaseNodeId = node.id;
        }

        const newData = {
            testCaseNodeId,
            userId: userId ?? existing.userId,
            roleId: roleId ?? existing.roleId,
            data: data ?? existing.data,
            description: description ?? existing.description,
            attachments: attachments ?? existing.attachments,
        };

        const isKeyChanged =
            newData.testCaseNodeId !== existing.testCaseNodeId ||
            newData.userId !== existing.userId ||
            newData.roleId !== existing.roleId;

        if (isKeyChanged) {
            const duplicate = await prisma.extraData.findFirst({
                where: {
                    testCaseNodeId: newData.testCaseNodeId,
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
            message: "ExtraData fully updated",
            data: unwrapData(updated),
        };
    },

    deleteExtraData: async ({ id }) => {
        await prisma.extraData.delete({ where: { id } });
        return {
            status: 200,
            success: true,
            message: "ExtraData deleted successfully",
        };
    },
};

export default extraDataService;
