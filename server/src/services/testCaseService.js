import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const testCaseService = {
    getAllTestCases: async () => {
        try {
            const testCases = await prisma.testCase.findMany({
                include: {
                    user: true
                },
            });
            return {
                status: 200,
                success: true,
                message: "Test cases fetched successfully",
                data: testCases,
            };
        } catch (error) {
            throw new Error("Failed to fetch test cases: " + error.message);
        }
    },

    getTestCaseById: async ({ id }) => {
        try {
            const testCase = await prisma.testCase.findUnique({
                where: { id },
                include: {
                    user: true,
                    testCaseNodes: {
                        include: {
                            extraData: true, // nếu cần lấy cả dữ liệu từng node
                        },
                    },
                    testCaseWorkflow: true, // nếu dùng workflowId từ bảng phụ
                },
            });

            if (!testCase) {
                return {
                    status: 404,
                    success: false,
                    message: "Test case not found",
                };
            }

            return {
                status: 200,
                success: true,
                message: "Test case fetched successfully",
                data: testCase,
            };
        } catch (error) {
            throw new Error("Failed to fetch test case: " + error.message);
        }
    },

    createTestCase: async (payload) => {
        const {
            name,
            type,
            project,
            status,
            userId,
            xmlContent,
            jsonContent,
            nodeData,
        } = payload;

        // Load file mặc định nếu không truyền xmlContent
        let finalXmlContent = xmlContent;
        if (!finalXmlContent) {
            const defaultPath = path.resolve("src", "resources", "newDiagram.bpmn");
            if (!fs.existsSync(defaultPath)) {
                throw new Error("Missing newDiagram.bpmn template file.");
            }
            finalXmlContent = fs.readFileSync(defaultPath, "utf8");
        }

        try {
            const existing = await prisma.testCase.findFirst({
                where: { name },
            });

            if (existing) {
                return {
                    status: 409,
                    success: false,
                    message: "Test case name already exists",
                };
            }

            const testCase = await prisma.testCase.create({
                data: {
                    name,
                    userId,
                    ...(type && { type }),
                    ...(project && { project }),
                    ...(status && { status }),
                    ...(finalXmlContent && { xmlContent: finalXmlContent }),
                    ...(jsonContent && { jsonContent }),
                    testCaseNodes: {
                        create: nodeData?.map((node) => ({
                            nodeId: node.nodeId,
                        })) || [],
                    },
                },
                include: {
                    testCaseNodes: true,
                },
            });
            return {
                status: 201,
                success: true,
                message: "Test case created successfully",
                data: testCase,
            };
        } catch (error) {
            throw new Error("Failed to create test case: " + error.message);
        }
    },

    updateTestCase: async ({ id, ...newData }) => {
        try {
            const existing = await prisma.testCase.findUnique({ where: { id } });
            if (!existing) {
                return {
                    status: 404,
                    success: false,
                    message: "Test case not found",
                };
            }

            // So sánh và chỉ giữ các field thực sự thay đổi
            const dataToUpdate = Object.entries(newData).reduce((acc, [key, value]) => {
                if (value !== undefined && existing[key] !== value) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            if (Object.keys(dataToUpdate).length === 0) {
                return {
                    status: 400,
                    success: false,
                    message: "No fields have been modified. Update aborted.",
                };
            }

            // Nếu có name mới → kiểm tra trùng
            if (dataToUpdate.name) {
                const nameExists = await prisma.testCase.findFirst({
                    where: {
                        name: dataToUpdate.name,
                        NOT: { id },
                    },
                });
                if (nameExists) {
                    return {
                        status: 409,
                        success: false,
                        message: "Another test case with the same name already exists",
                    };
                }
            }

            const updated = await prisma.testCase.update({
                where: { id },
                data: dataToUpdate,
            });

            return {
                status: 200,
                success: true,
                message: "Test case updated successfully",
                data: updated,
            };
        } catch (error) {
            throw new Error("Failed to update test case: " + error.message);
        }
    },

    deleteTestCase: async ({ id }) => {
        try {
            const existing = await prisma.testCase.findUnique({ where: { id } });
            if (!existing) {
                return {
                    status: 404,
                    success: false,
                    message: "Test case not found",
                };
            }

            // Lấy danh sách node liên quan
            const nodes = await prisma.testCaseNode.findMany({
                where: { testCaseId: id },
                select: { id: true },
            });

            const nodeIds = nodes.map((n) => n.id);

            // Xóa ExtraData trước
            await prisma.extraData.deleteMany({
                where: { testCaseNodeId: { in: nodeIds } },
            });

            // Xóa testCaseNode
            await prisma.testCaseNode.deleteMany({
                where: { testCaseId: id },
            });

            // Xóa testCaseWorkflow nếu có
            await prisma.testCaseWorkflow.deleteMany({
                where: { testCaseId: id },
            });

            // Cuối cùng xóa testCase
            await prisma.testCase.delete({ where: { id } });

            return {
                status: 200,
                success: true,
                message: "Test case deleted successfully",
            };
        } catch (error) {
            throw new Error("Failed to delete test case: " + error.message);
        }
    },
};

export default testCaseService;
