import elysianClient from '@/api/elysianClient'

export const categoryService = {
    getCategories,
    saveCategory
};

export default categoryService

async function getCategories() {
    return await elysianClient.getData(`/api/FinancialCategories`)
}

async function saveCategory(data: any) {
    return await elysianClient.postData(`/api/SaveFinancialCategory`, data)
}
