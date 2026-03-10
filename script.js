// 智能合约地址（部署后需要替换）
const CONTRACT_ADDRESS = '0xc4bd3874f36b469677aaa497e489dde1b2530320';

// 智能合约ABI
const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "balances",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Deposit",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Withdraw",
        "type": "event"
    }
];

let provider, signer, contract, userAddress;

// 初始化
async function init() {
    try {
        // 检测MetaMask
        if (!window.ethereum && !window.web3) {
            throw new Error('请安装MetaMask钱包');
        }
        
        // 连接钱包
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            throw new Error('连接钱包被拒绝');
        }
        
        // 设置提供者
        provider = new ethers.providers.Web3Provider(window.ethereum || window.web3.currentProvider);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // 检查网络
        const network = await provider.getNetwork();
        if (network.chainId !== 42161) { // Arbitrum One
            throw new Error('请切换到Arbitrum网络');
        }
        
        // 加载合约
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // 更新余额
        await updateBalances();
        
        // 监听事件
        contract.on('Deposit', (user, amount) => {
            if (user === userAddress) {
                showMessage(`成功存入 ${ethers.utils.formatEther(amount)} ETH`, 'success');
                updateBalances();
            }
        });
        
        contract.on('Withdraw', (user, amount) => {
            if (user === userAddress) {
                showMessage(`成功取出 ${ethers.utils.formatEther(amount)} ETH`, 'success');
                updateBalances();
            }
        });
        
        // 绑定按钮事件
        document.getElementById('deposit-btn').addEventListener('click', deposit);
        document.getElementById('withdraw-btn').addEventListener('click', withdraw);
        
        // 隐藏连接按钮
        document.getElementById('connect-btn').style.display = 'none';
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// 更新余额
async function updateBalances() {
    try {
        // 钱包余额
        const walletBalance = await provider.getBalance(userAddress);
        document.getElementById('wallet-balance').textContent = ethers.utils.formatEther(walletBalance);
        
        // 合约余额
        const contractBalance = await contract.getBalance(userAddress);
        document.getElementById('contract-balance').textContent = ethers.utils.formatEther(contractBalance);
        
    } catch (error) {
        showMessage('更新余额失败', 'error');
    }
}

// 存入ETH
async function deposit() {
    try {
        const amount = document.getElementById('deposit-amount').value;
        if (!amount || parseFloat(amount) <= 0) {
            throw new Error('请输入有效的金额');
        }
        
        const amountWei = ethers.utils.parseEther(amount);
        const tx = await contract.deposit({ value: amountWei });
        
        showMessage('交易处理中...', 'success');
        await tx.wait();
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// 取出ETH
async function withdraw() {
    try {
        const amount = document.getElementById('withdraw-amount').value;
        if (!amount || parseFloat(amount) <= 0) {
            throw new Error('请输入有效的金额');
        }
        
        const amountWei = ethers.utils.parseEther(amount);
        const tx = await contract.withdraw(amountWei);
        
        showMessage('交易处理中...', 'success');
        await tx.wait();
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// 显示消息
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = type;
    
    // 3秒后清除消息
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000);
}

// 绑定连接钱包按钮事件
document.getElementById('connect-btn').addEventListener('click', init);