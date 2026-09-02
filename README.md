# 5t5：无限

咒术回战同人顶视角割草。走位，叠术式，把涌上来的秽物割平。

> 同人作品，与官方无关。

## 玩法

- 选人：**5t5**（无极）开场可玩；活过一场解锁 **宿傩**
- **右键点地走**（按住右键跟着光标改路）；手机点地
- 术式自动释放；升级三选一：**新术** 开路，**进化** 改形状/数量，**支援** 垫步。苍+赫（解+捌）叠够能出 **合成**
- 每条术式四阶，不是同一句加半径。卡片和 HUD 写着现在第几阶
- **Q**：位移（5t5 瞬移，宿傩 瞬斩）
- **W**：5t5 赫 / 宿傩 捌（解锁后可立刻再放，平时也自己放）
- **E**：5t5 虚式 / 宿傩 开
- **R**：术域
- **Esc / P** 暂停
- 活过 **3:00** 收束；死了也能看战绩
- **黑闪** 会连锁弹跳，击杀喷血
- 活过一分半或通关：下次起手加一（苍 / 捌）

## 本地运行

需要 Node.js 22+。

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:8080](http://localhost:8080)。

```bash
npm run build
```

静态页（给 deepdemos 这类只要根上有 `index.html` 的主机）：

```bash
npm run build:static
```

产物在 `artifacts/5t5-limitless-web.zip`。解开后 `index.html` 必须在根目录，直接上传那个 zip。不经过 Node / 登录 / PWA。`npm run dev` 不受影响。

## 技术

TanStack Start · Vite · React · Canvas 2D · Tailwind
