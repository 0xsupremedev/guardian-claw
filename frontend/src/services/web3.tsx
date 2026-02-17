import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get ProjectId from https://cloud.walletconnect.com
// For hackathon demo, using a placeholder or public key if available
const projectId = '8e3518905387440eab717bd179f82991'

// 2. Set chains
const opBNBTestnet = {
    chainId: 5611,
    name: 'opBNB Testnet',
    currency: 'tBNB',
    explorerUrl: 'https://opbnb-testnet.bscscan.com',
    rpcUrl: 'https://opbnb-testnet-rpc.bnbchain.org'
}

const bscTestnet = {
    chainId: 97,
    name: 'BSC Testnet',
    currency: 'tBNB',
    explorerUrl: 'https://testnet.bscscan.com',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
}

// 3. Create a metadata object
const metadata = {
    name: 'GuardianClaw',
    description: 'AI-Powered Transaction Firewall',
    url: 'https://guardianclaw.ai', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
    metadata,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: true,
})

// 5. Create a Web3Modal instance
createWeb3Modal({
    ethersConfig,
    chains: [opBNBTestnet, bscTestnet],
    projectId,
    enableAnalytics: true,
    themeVariables: {
        '--w3m-color-mix': '#6366f1',
        '--w3m-color-mix-strength': 40,
        '--w3m-accent': '#6366f1',
        '--w3m-border-radius-master': '12px'
    }
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
