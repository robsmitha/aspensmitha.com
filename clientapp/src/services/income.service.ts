import elysianClient from '@/api/elysianClient'
import { IncomePayment, IncomeSource } from '@/store/types';

export const incomeService = {
    getIncomeSource,
    getIncomeSources,
    getTransactions,
    saveIncomeSource,
    saveIncomePayment,
    deleteIncomeSource,
    deleteIncomePayment
};

export default incomeService;

/**
 * GET /api/GetIncomeSources?institutionAccessItemId=123
 */
async function getIncomeSource(incomeSourceId: number) {
    const params = new URLSearchParams({ incomeSourceId: incomeSourceId.toString() });
    return await elysianClient.getData(`/api/GetIncomeSource?${params}`);
}

/**
 * GET /api/GetIncomeSources?institutionAccessItemId=123
 */
async function getIncomeSources(institutionAccessItemId: number, month: number | undefined, year: number | undefined) {
    const params = new URLSearchParams();

    params.set('institutionAccessItemId', institutionAccessItemId.toString());

    if (month != null) params.set('month', month.toString());
    if (year != null) params.set('year', year.toString());
    
    return await elysianClient.getData(`/api/GetIncomeSources?${params}`);
}

/**
 * GET /api/GetTransactions?institutionAccessItemId=123
 */
async function getTransactions(institutionAccessItemId: number) {
    const params = new URLSearchParams({ institutionAccessItemId: institutionAccessItemId.toString() });
    return await elysianClient.getData(`/api/GetTransactions?${params}`);
}

/**
 * POST /api/SaveIncomeSource
 */
async function saveIncomeSource(data: IncomeSource) {
    return await elysianClient.postData(`/api/SaveIncomeSource`, data);
}

/**
 * POST /api/SaveIncomePayment
 */
async function saveIncomePayment(data: IncomePayment) {
    return await elysianClient.postData(`/api/SaveIncomePayment`, data);
}

/**
 * POST /api/DeleteIncomeSource
 */
async function deleteIncomeSource(command: { incomeSourceId: number }) {
    return await elysianClient.postData(`/api/DeleteIncomeSource`, command);
}

/**
 * POST /api/DeleteIncomePayment
 */
async function deleteIncomePayment(command: { incomePaymentId: number }) {
    return await elysianClient.postData(`/api/DeleteIncomePayment`, command);
}
