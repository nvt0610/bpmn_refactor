import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const testCaseNodeService = {
    getAllTestCaseNodes: async ({ testCaseId, page, pageSize }) => {
        try {
            const testCase = await prisma.testCase.findUnique({
                where: { id: testCaseId },
                select: { id: true, xmlContent: true },
            });

            if (!testCase) {
                return { status: 404, success: false, message: "Test case not found" };
            }

            const skip = page && pageSize ? (parseInt(page) - 1) * parseInt(pageSize) : undefined;
            const take = page && pageSize ? parseInt(pageSize) : undefined;

            const nodes = await prisma.testCaseNode.findMany({
                where: { testCaseId },
                select: {
                    nodeId: true,
                    extraData: {
                        select: {
                            data: true,
                            description: true,
                            attachments: true,
                        }
                    }
                },
                skip,
                take,
            });

            const total = await prisma.testCaseNode.count({ where: { testCaseId } });

            const formattedNodes = nodes.map((n) => {
                const merged = n.extraData
                    .filter(Boolean)
                    .reduce((acc, cur) => ({
                        ...acc,
                        ...cur.data,
                        ...(cur.description ? { description: cur.description } : {}),
                        ...(cur.attachments && cur.attachments.length > 0 ? { attachments: cur.attachments } : {})
                    }), {});
                return { nodeId: n.nodeId, extraData: merged };
            });

            return {
                status: 200,
                success: true,
                data: {
                    testCaseId: testCase.id,
                    xmlContent: testCase.xmlContent,
                    nodes: formattedNodes,
                    total,
                    page: page ? parseInt(page) : undefined,
                    pageSize: pageSize ? parseInt(pageSize) : undefined,
                },
            };
        } catch (error) {
            throw new Error("Failed to fetch test case nodes: " + error.message);
        }
    },

    // Lấy toàn bộ node theo testCaseId
    getNodesByTestCaseId: async (testCaseId) => {
        try {
            const testCase = await prisma.testCase.findUnique({
                where: { id: testCaseId },
                select: {
                    id: true,
                    xmlContent: true,
                },
            });

            if (!testCase) {
                return {
                    status: 404,
                    success: false,
                    message: "Test case not found",
                };
            }

            const nodes = await prisma.testCaseNode.findMany({
                where: { testCaseId },
                select: {
                    nodeId: true,
                    extraData: {
                        select: {
                            data: true,
                            description: true,    // lấy ở đây
                            attachments: true     // lấy ở đây
                        }
                    }
                }
            });

            const formattedNodes = nodes.map((n) => {
                // gộp extraData thành 1 object
                const merged = n.extraData
                    .filter(Boolean)
                    .reduce((acc, cur) => ({
                        ...acc,
                        ...cur.data,
                        // merge description và attachments nếu có
                        ...(cur.description ? { description: cur.description } : {}),
                        ...(cur.attachments && cur.attachments.length > 0 ? { attachments: cur.attachments } : {})
                    }), {});

                return {
                    nodeId: n.nodeId,
                    extraData: merged
                };
            });

            return {
                status: 200,
                data: {
                    testCaseId: testCase.id,
                    xmlContent: testCase.xmlContent,
                    nodes: formattedNodes,
                },
            };
        } catch (error) {
            throw new Error("Failed to fetch test case nodes: " + error.message);
        }
    },

    // Tạo node mới (nếu chưa có)
    createNode: async ({ testCaseId, nodeId }) => {
        try {
            const existing = await prisma.testCaseNode.findUnique({
                where: {
                    testCaseId_nodeId: {
                        testCaseId,
                        nodeId,
                    },
                },
            });

            if (existing) {
                return {
                    status: 409,
                    success: false,
                    message: "Node already exists in this test case",
                };
            }

            const newNode = await prisma.testCaseNode.create({
                data: { testCaseId, nodeId },
            });

            return {
                status: 201,
                success: true,
                message: "Node created successfully",
                data: newNode,
            };
        } catch (error) {
            throw new Error("Failed to create node: " + error.message);
        }
    },

    // Xóa 1 node (và dữ liệu extra liên quan)
    deleteNode: async ({ testCaseId, nodeId }) => {
        try {
            const node = await prisma.testCaseNode.findUnique({
                where: {
                    testCaseId_nodeId: {
                        testCaseId,
                        nodeId,
                    },
                },
            });

            if (!node) {
                return {
                    status: 404,
                    success: false,
                    message: "Node not found",
                };
            }

            // Xóa extraData trước
            await prisma.extraData.deleteMany({
                where: { testCaseNodeId: node.id },
            });

            // Xóa node
            await prisma.testCaseNode.delete({
                where: { id: node.id },
            });

            return {
                status: 200,
                success: true,
                message: "Node deleted successfully",
            };
        } catch (error) {
            throw new Error("Failed to delete node: " + error.message);
        }
    },
    // Cập nhật nodeId mới
    updateNode: async ({ testCaseId, oldNodeId, newNodeId }) => {
        try {
            if (!testCaseId || !oldNodeId || !newNodeId) {
                return {
                    status: 400,
                    success: false,
                    message: "Missing required fields: testCaseId, oldNodeId, newNodeId",
                };
            }

            // Tìm node hiện tại
            const existing = await prisma.testCaseNode.findUnique({
                where: {
                    testCaseId_nodeId: {
                        testCaseId,
                        nodeId: oldNodeId,
                    },
                },
            });

            if (!existing) {
                return {
                    status: 404,
                    success: false,
                    message: "Node not found",
                };
            }

            // Kiểm tra node mới đã tồn tại chưa
            const conflict = await prisma.testCaseNode.findUnique({
                where: {
                    testCaseId_nodeId: {
                        testCaseId,
                        nodeId: newNodeId,
                    },
                },
            });

            if (conflict) {
                return {
                    status: 409,
                    success: false,
                    message: "New nodeId already exists in this test case",
                };
            }

            // Cập nhật nodeId
            const updated = await prisma.testCaseNode.update({
                where: { id: existing.id },
                data: { nodeId: newNodeId },
            });

            return {
                status: 200,
                success: true,
                message: "Node updated successfully",
                data: updated,
            };
        } catch (error) {
            throw new Error("Failed to update node: " + error.message);
        }
    },
};

export default testCaseNodeService;
