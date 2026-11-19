import { createSiteWorker } from '@robsmitha/site-edge'

// This Worker serves one tenant, and says so itself. The browser never chooses.
export default createSiteWorker({ tenant: 'aspensmitha' })
