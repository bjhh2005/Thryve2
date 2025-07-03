// electron/after-pack.js
// 这个脚本会在Electron-builder打包后执行，用于确保后端文件正确复制

const fs = require('fs');
const path = require('path');

// 规范化路径，处理Windows路径问题
function normalizePath(pathStr) {
  if (!pathStr) return pathStr;
  
  // 确保路径使用正确的分隔符
  return path.normalize(pathStr);
}

// 是否应该排除的文件（只排除缓存和临时文件）
function shouldExclude(filePath) {
  // 只排除缓存和临时文件
  const excludePatterns = [
    /__pycache__/,     // Python缓存目录
    /\.git/,           // Git目录
    /\.vscode/,        // VSCode配置
    /\.idea/,          // PyCharm配置
    /\.gitignore$/,    // Git忽略文件
    /\.pyc~$/,         // 临时编译文件
    /\.pyo~$/,         // 临时优化编译文件
    /\.spec$/          // PyInstaller规格文件
  ];
  
  return excludePatterns.some(pattern => pattern.test(filePath));
}

// 复制文件或目录的函数，但排除Python源代码
function copyRecursiveSync(src, dest) {
  try {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    // 检查是否应该排除
    if (shouldExclude(src)) {
      console.log(`Skipping excluded file: ${src}`);
      return;
    }
    
    if (isDirectory) {
      // 如果目标目录不存在，创建它
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
        console.log(`Created directory: ${dest}`);
      }
      
      // 递归复制子目录和文件
      fs.readdirSync(src).forEach(childItemName => {
        copyRecursiveSync(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        );
      });
    } else {
      // 确保目标目录存在
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        console.log(`Created directory: ${destDir}`);
      }
      
      // 复制文件
      fs.copyFileSync(src, dest);
      console.log(`Copied file: ${src} -> ${dest}`);
    }
  } catch (err) {
    console.error(`Error during copy: ${err.message}`);
    console.error(`Source: ${src}`);
    console.error(`Destination: ${dest}`);
  }
}

/**
 * 在打包后执行的操作
 * @param {Object} context - electron-builder上下文
 */
exports.default = async function(context) {
  const { appOutDir, outDir, electronPlatformName } = context;
  console.log('Running afterPack script...');
  console.log(`App output directory: ${appOutDir}`);
  console.log(`Output directory: ${outDir}`);
  console.log(`Platform: ${electronPlatformName}`);

  // 规范化路径
  const normalizedAppOutDir = normalizePath(appOutDir);
  console.log(`Normalized app output directory: ${normalizedAppOutDir}`);

  // 检查资源目录
  const resourcesPath = path.join(normalizedAppOutDir, 'resources');
  const backendPath = path.join(resourcesPath, 'backend');
  
  console.log(`Resources path: ${resourcesPath}`);
  console.log(`Backend path: ${backendPath}`);
  
  // 检查目标后端目录是否存在
  if (!fs.existsSync(backendPath)) {
    console.log(`Creating backend directory at: ${backendPath}`);
    fs.mkdirSync(backendPath, { recursive: true });
  }
  
  // 后端可执行文件路径
  const backendExeName = electronPlatformName === 'win32' ? 'Thryve_back.exe' : 'Thryve_back';
  const backendExe = path.join(backendPath, backendExeName);
  
  // 源后端目录
  const sourceBackendDir = path.resolve(process.cwd(), '..', 'Backend', 'dist', 'Thryve_back');
  const sourceBackendExe = path.join(sourceBackendDir, backendExeName);
  
  console.log(`Looking for backend executable at: ${sourceBackendExe}`);
  
  // 复制后端可执行文件
  if (fs.existsSync(sourceBackendExe)) {
    console.log(`Copying backend executable from ${sourceBackendExe} to ${backendExe}`);
    await fs.promises.copyFile(sourceBackendExe, backendExe);
    console.log('Backend executable copied successfully.');
  } else {
    console.error(`Backend executable not found at ${sourceBackendExe}`);
  }
  
  // 复制_internal目录的内容
  const sourceInternalDir = path.join(sourceBackendDir, '_internal');
  const targetInternalDir = path.join(backendPath, '_internal');
  
  if (fs.existsSync(sourceInternalDir)) {
    console.log(`Copying _internal directory from ${sourceInternalDir} to ${targetInternalDir}`);
    
    // 确保目标目录存在
    if (!fs.existsSync(targetInternalDir)) {
      fs.mkdirSync(targetInternalDir, { recursive: true });
    }
    
    // 复制_internal目录下的所有文件
    try {
      await copyDir(sourceInternalDir, targetInternalDir);
      console.log('_internal directory copied successfully.');
    } catch (err) {
      console.error(`Error copying _internal directory: ${err.message}`);
    }
  } else {
    console.error(`_internal directory not found at ${sourceInternalDir}`);
  }
  
  // 确保.env文件也被复制到backend目录
  const sourceEnvFile = path.join(process.cwd(), '..', 'Backend', '.env');
  const targetEnvFile = path.join(backendPath, '.env');
  
  if (fs.existsSync(sourceEnvFile)) {
    console.log(`Copying .env file from ${sourceEnvFile} to ${targetEnvFile}`);
    await fs.promises.copyFile(sourceEnvFile, targetEnvFile);
    console.log('.env file copied to backend directory.');
  } else {
    console.warn(`.env file not found at ${sourceEnvFile}`);
  }
} 