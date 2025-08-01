import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const N8nService = {
    N8N_ENDPOINT: process.env.N8N_ENDPOINT,

    exportWorkflowFromTestCase: async (testCaseId) => {
        try {
            const testCase = await prisma.TestCase.findUnique({
                where: { id: testCaseId },
                select: { id: true, xmlContent: true },
            });



            if (!testCase || !testCase.xmlContent) {
                return {
                    status: 404,
                    success: false,
                    message: "Test case or XML content not found",
                };
            }

            const tokenResponse = await N8nService.getToken();
            if (!tokenResponse?.data?.access_token) {
                return {
                    status: 500,
                    success: false,
                    message: "Failed to retrieve access token",
                };
            }

            const token = tokenResponse.data.access_token;


            const response = await axios.post(
                `${N8nService.N8N_ENDPOINT}/test-automation/api/v1/workflows`,
                testCase.xmlContent,
                { headers: { "Content-Type": "text/xml", 'Authorization': `Bearer ${token}` } }
            );
            console.log(response);

            const n8nWorkflowId = response?.data?.data?.id || response?.data?.id;
            if (!n8nWorkflowId) {
                return {
                    status: 500,
                    success: false,
                    message: "Failed to retrieve n8n workflow ID",
                    n8nResponse: response.data, // <--- Thêm dòng này
                };
            }

            await prisma.testCaseWorkflow.upsert({
                where: { testCaseId },
                update: { workflowId: n8nWorkflowId },
                create: { testCaseId, workflowId: n8nWorkflowId },
            });

            return {
                status: 200,
                success: true,
                message: "Workflow exported successfully",
                data: response.data,
            };
        } catch (error) {
            throw new Error("Failed to export workflow: " + error.message);
        }
    },

    getWorkflow: async (workflowId) => {
        try {
            const response = await axios.get(
                `${N8nService.N8N_ENDPOINT}/test-automation/api/v1/workflows/${workflowId}`,
                { headers: { "Content-Type": "application/json" } }
            );

            return {
                status: 200,
                success: true,
                message: "Workflow fetched successfully",
                data: response.data,
            };
        } catch (error) {
            throw new Error("Failed to retrieve workflow: " + error.message);
        }
    },

    getToken: async () => {
        try {
            const url = `${N8nService.N8N_ENDPOINT}/auth/token`;

            const data = new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                grant_type: 'client_credentials',
                client_secret: process.env.CLIENT_SECRET,
            });

            const response = await axios.post(url, data.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            return {
                status: 200,
                success: true,
                message: 'Token fetched successfully',
                data: response.data,
            };
        } catch (error) {
            throw new Error('Failed to retrieve token: ' + (error.response?.data?.error || error.message));
        }
    },

    getTestCaseById: async (testCaseId) => {
        try {
            const testCase = await prisma.testCase.findUnique({
                where: { id: testCaseId },
                include: {
                    user: { select: { id: true, username: true } },
                    testCaseWorkflow: true,
                },
            });

            if (!testCase) {
                return {
                    status: 404,
                    success: false,
                    message: "Test case not found",
                };
            }

            const workflowId = testCase?.testCaseWorkflow?.workflowId;
            let workflowData = null;

            if (workflowId) {
                try {
                    const res = await N8nService.getWorkflow(workflowId);
                    workflowData = res.data?.data || null;
                } catch (err) {
                    return {
                        status: 500,
                        success: false,
                        message: "Failed to fetch workflow from N8N: " + err.message,
                    };
                }
            }

            return {
                status: 200,
                success: true,
                message: "Test case fetched successfully",
                data: {
                    ...testCase,
                    workflow: workflowData,
                },
            };
        } catch (error) {
            throw new Error("Failed to retrieve test case: " + error.message);
        }
    },
};

export default N8nService;