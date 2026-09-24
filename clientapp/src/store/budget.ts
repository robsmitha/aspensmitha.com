// Utilities
import { defineStore } from 'pinia'

import accessItemService from "@/services/accessItem.service"
import budgetService from "@/services/budget.service"
import categoryService from "@/services/category.service"

type State = {
  categories: any | undefined,
  accessItems: any | undefined,
  budget: any | undefined,
  loadingBudget: boolean
}

export const useBudgetStore = defineStore('budget', {
  state: (): State => ({
    categories: undefined,
    accessItems: undefined,
    budget: undefined,
    loadingBudget: false
  }),
  getters: {
    
  },
  actions: {
    async fetchCategories(): Promise<void> {
      const response = await categoryService.getCategories()
      this.categories = response.data
    },
    async fetchAccessItems(): Promise<void> {
      const response = await accessItemService.getUserAccessItems()
      this.accessItems = response.data
    },
    async fetchBudget(budgetId: number){
        this.loadingBudget = true
        const response = await budgetService.getBudget(budgetId)
        this.budget = response.data
        this.loadingBudget = false
    },
    async setTransactionsCategory(budgetId: number, categoryId: number, transactions: any){
      this.loadingBudget = true
      const data = transactions?.map((t: any) => {
          return {
              transactionId: t.transaction_id,
              financialCategoryId: categoryId,
              budgetId: budgetId
          }
      })
      await budgetService.bulkUpdateTransactionCategory(data);
      this.loadingBudget = false
    },
    async restoreTransactions(budgetId: number, t: any) {
      this.loadingBudget = true
      await budgetService.setRestoredTransaction({
          transactionId: t.transaction_id,
          budgetId: budgetId
      })
      this.loadingBudget = false
    },
    async excludeTransactions(budgetId: number, t: any) {
      this.loadingBudget = true
      await budgetService.setExcludedTransaction({
          transactionId: t.transaction_id,
          budgetId: budgetId
      })
      this.loadingBudget = false
    },
    async updateBudgetCategoryEstimate(budgetId: number, categoryName: string, estimate: number){
        this.loadingBudget = true
        await budgetService.updateBudgetCategoryEstimate({
          estimate: estimate,
          financialCategoryName: categoryName,
          budgetId: budgetId
        })
        this.loadingBudget = false
    },
  }
})