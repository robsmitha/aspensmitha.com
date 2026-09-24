// Utilities
import { defineStore } from 'pinia'

import incomeService from "@/services/income.service"
import { IncomeSourcesResponse, TransactionsResponse, MonthlyTimeline } from './types'

type State = {
  incomeSourceResponse: IncomeSourcesResponse | null,
  loadingIncome: boolean,
  transactionsResponse: TransactionsResponse | null,
  loadingTransactions: boolean,
  selectedMonthlyTimeline: MonthlyTimeline | null
}

export const useIncomeStore = defineStore('income', {
  state: (): State => ({
    incomeSourceResponse: null,
    loadingIncome: false,
    transactionsResponse: null,
    loadingTransactions: false,
    selectedMonthlyTimeline: null
  }),
  getters: {
    transactions: (state) => {
      const transactions = state.transactionsResponse?.transactions;
      return transactions?.filter(t => t.amount > 0) || [];
    },
  },
  actions: {
    async fetchIncomeSources(institutionAccessItemId: number){
        this.loadingIncome = true
        const response = await incomeService.getIncomeSources(institutionAccessItemId, this.selectedMonthlyTimeline?.month, this.selectedMonthlyTimeline?.year)
        this.incomeSourceResponse = response.data
        if(!this.selectedMonthlyTimeline){
          this.selectedMonthlyTimeline = this.incomeSourceResponse!.monthlyTimeline
        }
        this.loadingIncome = false
    },
    async fetchTransactions(institutionAccessItemId: number){
        this.loadingTransactions = true
        const response = await incomeService.getTransactions(institutionAccessItemId)
        this.transactionsResponse = response.data
        this.loadingTransactions = false
    },
  }
})