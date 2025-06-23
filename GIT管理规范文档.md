# GIT协作流程与操作手册

## 一、分支模型

我们的仓库将主要维护以下几类分支：

| 分支类型               | 命名规范           | 来源      | 合并目标            | 生命周期 | 作用                                                         |
| ---------------------- | ------------------ | --------- | ------------------- | -------- | ------------------------------------------------------------ |
| **主分支 (Main)**      | `main`             | -         | -                   | 永久     | **生产环境代码**，受保护，只接受来自 `develop` 或 `hotfix` 的合并。 |
| **开发分支 (Develop)** | `develop`          | `main`    | `main`              | 永久     | **功能集成分支**，所有特性分支开发完成后合并到此。           |
| **特性分支 (Feature)** | `feature/功能描述` | `develop` | `develop`           | 短期     | 开发新功能或执行具体任务。例如: `feature/user-login`, `feature/order-api`。 |
| **修复分支 (Hotfix)**  | `hotfix/问题描述`  | `main`    | `main` 和 `develop` | 短期     | 修复线上紧急 Bug。例如: `hotfix/login-bug`。                 |

## 二、核心开发工作流

这是每位成员日常开发需要遵循的步骤。

#### **第1步：开始一个新任务**

1. 确保你的本地仓库是最新的。

   ```bash
   # 切换到开发分支
   git checkout develop
   # 拉取远程最新的代码
   git pull origin develop
   ```

2. 从 `develop` 分支创建你自己的特性分支。分支名应清晰描述任务内容。

   ```bash
   # 创建并切换到新分支
   # 示例：开发一个用户登录功能
   git checkout -b feature/user-login  #创建一个 feature/user-login 分支
   ```

#### **第2步：本地开发与提交**

1. 在你的 `feature/user-login` 分支上进行编码工作。

2. 进行**小颗粒度**的提交。完成一个小的、独立的功能点就进行一次提交。

   ```bash
   # 添加变更文件到暂存区
   git add .
   # 按照规范提交（规范见第三节）
   git commit -m "feat(auth): implement user password validation"
   ```

3. 定期将你的本地分支推送到远程仓库，以作备份和方便他人查看进度。

   ```bash
   # 第一次推送时使用 -u 参数，将本地分支与远程分支关联
   git push -u origin feature/user-login
   # 后续推送直接使用
   git push
   ```

#### **第3步：创建合并请求 (Pull Request)**

1. 当你的功能开发完成并通过自测后，准备将其合并到 `develop` 分支。
2. 在推送完所有代码后，访问 Github。
3. 创建一个新的 **Pull Request (PR)** 或 **Merge Request (MR)**。
   - **源分支 (Source Branch)**: `feature/user-login` (你的特性分支)
   - **目标分支 (Target Branch)**: `develop`
4. 在 PR 描述中，清晰地写明：
   - **这个 PR 做了什么？** (如：实现了用户登录功能)
   - **为什么这么做？** (如：根据产品需求 v1.2)
   - **如何测试？** (如：启动项目后，访问 /login 页面进行测试)
   - **@** 至少一位或两位相关的同事来进行代码审查。

#### **第4步：代码审查与合并**

1. 被 @ 到的同事会审查你的代码，并在 PR 页面上提出修改意见。

2. 你根据意见在本地 `feature/user-login` 分支上进行修改，然后 `git push` 新的提交。PR 会自动更新。

3. 当所有意见都解决，并且至少有一位同事**批准 (Approve)** 后，你（或仓库管理员）就可以点击“Merge Pull Request”按钮，将代码合并到 `develop` 分支。

4. 合并后，删除该特性分支。

   ```bash
   # 删除远程分支 (通常在 PR 合并后平台会自动提示)
   git push origin --delete feature/user-login
   # 删除本地分支
   git checkout develop
   git branch -d feature/user-login
   ```



## 三、Git Commit Message 规范

我们采用 **AngularJS 规范**，它结构清晰，便于生成 Change Log。

**格式**: `<type>(<scope>): <subject>`

- type (类型):
  - `feat`: 新功能 (feature)
  - `fix`: 修复 bug
  - `docs`: 仅仅修改了文档
  - `style`: 代码格式修改，不影响代码逻辑 (空格、分号等)
  - `refactor`: 代码重构，既没加新功能也没修复 bug
  - `test`: 增加或修改测试
  - `chore`: 构建过程或辅助工具的变动 (如修改 .gitignore)
- **scope (范围，可选)**: 本次提交影响的范围，如 `user`, `order`, `auth` 等。
- **subject (主题)**: 简短描述，不超过50个字符。

**示例**:

- `feat(user): add user registration endpoint`
- `fix(order): correct calculation of total price`
- `docs(readme): update project setup instructions`

## 四、冲突解决指南

冲突不可怕，规范解决即可。

**原则：永远在自己的特性分支上解决冲突。**

1. 当你的 PR 提示存在冲突时，或者你想在提交PR前主动更新代码时，执行以下操作：

   ```bash
   # 1. 确保在你的特性分支上
   git checkout feature/user-login
   
   # 2. 拉取最新的 develop 分支代码
   git pull origin develop
   ```

   此时，Git 会尝试自动合并。如果存在冲突，它会提示你。

2. 打开有冲突的文件，你会看到类似下面的标记：

   ```bash
   <<<<<<< HEAD
   你的代码
   =======
   develop 分支的代码
   >>>>>>> develop
   ```

3. 与同事沟通，或根据逻辑判断，手动修改文件，删除 `<<<<<<<`, `=======`, `>>>>>>>` 这些标记，使文件内容达到最终正确状态。

4. 保存文件后，将修改后的文件重新添加到暂存区。

   ```bash
   git add <有冲突的文件名>
   ```

5. 完成所有冲突文件的修改后，执行 `commit` 来完成这次合并。Git 会自动生成一个合并提交信息，直接保存即可。

   ```bash
   git commit
   ```

6. 最后，将解决了冲突的分支推送到远程。

   ```bash
   git push
   ```

   现在你的 PR 中的冲突已经解决。

## 五、版本回滚方案

当错误代码被合入后，需要进行回滚。

**情况一：回滚一个已经合并的 PR (最安全、推荐)**

比如 `develop` 分支合入了一个有问题的 `feature`，需要撤销这次合并。

1. 在 `develop` 分支上，找到那个错误的**合并提交 (Merge Commit)** 的哈希值 (Hash)。

2. 使用 `git revert`命令。这个命令会创建一个新的提交，内容是目标提交的逆向操作，非常安全。

   ```bash
   # 切换到 develop 分支
   git checkout develop
   git pull
   # -m 1 表示保留主线，撤销合并进来的分支的更改
   git revert -m 1 <那个错误的合并提交的Hash值>
   # 推送回滚提交
   git push
   ```

**情况二：撤销自己本地的几次提交 (未推送)**

如果你在本地分支连续提交了几次，发现方向错了，想撤销。

```bash
# 撤销最近一次提交，但保留代码更改
git reset --soft HEAD~1
# 彻底丢弃最近一次提交的所有更改 (危险操作)
git reset --hard HEAD~1
```

**强烈建议：对于已经推送到共享分支 (develop, main) 的代码，永远使用 git revert 进行回滚，而不是 git reset，以避免重写公共历史记录。**

------

**紧急线上 Bug 修复 (Hotfix) 流程**

1. 从 `main`分支创建 `hotfix`分支。

   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/payment-issue
   ```

2. 修复、提交。

3. 修复完成后，

   必须先合并到 `main` 分支

   ，用于紧急上线。

   - 创建 PR：`hotfix/payment-issue` -> `main`
   - 审查通过后合并。
   - 在 `main` 分支上打上新的 Tag。

4. 然后，

   再将此 `hotfix` 分支合并到 `develop` 分支

   ，确保开发分支也包含了这个修复。

   - 创建 PR：`hotfix/payment-issue` -> `develop`
   - 审查通过后合并。

5. 删除 `hotfix` 分支。



## 六、项目GIT注意事项与解决方案

1.解决项目过大，导致Git效率过低的问题

- 修改 `.gitignore` 文件，不提交空间过大的 `node_modules` 模块

```c
//在.gitignore 添加下面内容

node_modules/
```

- 提交命令

```shell
# 如果 node_modules 已经被加入过 git，需要先移除
git rm -r --cached node_modules

git commit -m "忽略 node_modules 文件夹"
```

- 当 更新包 后只需运行（依赖包的信息已经存储在 `package.json` 中）

```
npm install
```



