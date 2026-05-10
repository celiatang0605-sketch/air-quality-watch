## 提现兑换 AVAX 比例调整方案

将兑换比例从「1000 积分 = 0.001 AVAX」改为「50 积分 = 0.01 AVAX」（即每积分 0.0002 AVAX，最低 50 起兑）。仅修改前端展示、校验和兑换循环次数；保留 Phantom 连接、Solana Devnet 合约卡片、绿色视觉与路由。

### 改动点（均在 `src/pages/Index.tsx`）

1. **常量**：在 `WithdrawPage` 与 `submitWithdraw` 作用域内引入本地常量
   - `POINTS_PER_UNIT = 50`
   - `AVAX_PER_UNIT = 0.01`
   - 不再使用 `POINTS_PER_EXCHANGE`（值为 1000），保留 import 但改为本地新常量计算。

2. **顶部卡片文案**（约 1881 行）
   - 「兑换比率：1000 积分 = 0.001 AVAX」→「兑换比率：50 积分 = 0.01 AVAX」

3. **输入区文案与全部兑换按钮**（约 1920–1932 行）
   - 标题：「提现积分（最少 50 起兑）」
   - 全部兑换：`setAmount(String(Math.floor(points / 50) * 50))`
   - 实时预计：`amount && parseInt(amount,10) >= 50` 时显示
     `预计获得 {(Math.floor(parseInt(amount,10) / 50) * 0.01).toFixed(2)} AVAX`

4. **`WithdrawPage` 内 `submit` 校验**（约 1866–1872 行）改为：
   - 空 → 「请输入提现积分数量」
   - `< 50` → 「最低 50 积分起兑」
   - `> points` → 「积分余额不足」
   - 通过后向下取整到 50 的整数倍后传给 `onSubmit`

5. **`submitWithdraw` 链上逻辑**（约 463–499 行）
   - 校验文案同上（「最低 50 积分起兑」「积分余额不足」）
   - `exchanges = Math.floor(amount / 50)`，`usePoints = exchanges * 50`
   - 链上循环调用 `exchangePoints(phantom)` `exchanges` 次（合约本身一次调用单位不变，前端按 50 积分 = 一次兑换的口径循环；金额展示按新比例）
   - 记录文案：`已上链 (${(exchanges * 0.01).toFixed(2)} AVAX)`
   - 其余 toast、记录、扣分流程保持

### 不动的内容

- Phantom 连接 / 切换 / 复制地址区块
- Solana Devnet 合约展示卡片（Program: Hs768q1NX1...）
- 顶部绿色渐变卡、整体绿色风格、底部导航、路由结构
- 积分获取规则（评价 +5、笔记 +10、场所 +10）
- 兑换记录列表 UI

### 备注

链上 `exchange_points` 合约方法本身无金额参数（每次调用消耗固定积分换固定 AVAX），所以「按新比例传入」在前端通过「调用次数 = 积分/50」实现，UI 与积分扣减、AVAX 到账文案严格按 50:0.01 同步。