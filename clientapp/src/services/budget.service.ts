import elysianClient from '@/api/elysianClient'

export const budgetService = {
    bulkUpdateTransactionCategory,
    saveBudget,
    getBudgets,
    getBudget,
    getTransactions,
    updateBudgetCategoryEstimate,
    setExcludedTransaction,
    setRestoredTransaction
};

export default budgetService

async function getBudget(budgetId: number) {
    return await elysianClient.getData(`/api/GetBudget?budgetId=${budgetId}`)
}

async function getTransactions(budgetId: number) {
    return await elysianClient.getData(`/api/GetBudgetTransactions?budgetId=${budgetId}`)
}

async function getBudgets() {
    return await elysianClient.getData(`/api/GetBudgets`)
}

async function bulkUpdateTransactionCategory (data: any) {
    return await elysianClient.postData(`/api/BulkUpdateTransactionCategory`, data)
}

async function saveBudget(data: any) {
    return await elysianClient.postData(`/api/SaveBudget`, data)
}

async function updateBudgetCategoryEstimate (data: any) {
    return await elysianClient.postData(`/api/UpdateBudgetCategoryEstimate`, data)
}

async function setExcludedTransaction (data: any) {
    return await elysianClient.postData(`/api/SetExcludedTransaction`, data)
}

async function setRestoredTransaction (data: any) {
    return await elysianClient.postData(`/api/RestoreExcludedTransaction`, data)
}
