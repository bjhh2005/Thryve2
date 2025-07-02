// electron/after-pack.js
// 这个脚本会在Electron-builder打包后执行，用于确保后端文件正确复制

const fs = require('fs');
const path = require('path');

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

  // 检查资源目录
  const resourcesPath = path.join(appOutDir, 'resources');
  const backendPath = path.join(resourcesPath, 'backend');
  
  // 检查目标后端目录是否存在
  if (!fs.existsSync(backendPath)) {
    console.log(`Creating backend directory at: ${backendPath}`);
    fs.mkdirSync(backendPath, { recursive: true });
  }
  
  // 检查是否有后端可执行文件
  let backendExe = path.join(backendPath, electronPlatformName === 'win32' ? 'backend.exe' : 'backend');
  
  if (!fs.existsSync(backendExe)) {
    console.log(`Backend executable not found at: ${backendExe}`);
    
    // 尝试从项目源目录复制
    const sourceBackendPath = path.resolve(
      process.cwd(), 
      '..', 
      'Backend', 
      'dist', 
      'backend', 
      electronPlatformName === 'win32' ? 'backend.exe' : 'backend'
    );
    
    console.log(`Trying to copy from: ${sourceBackendPath}`);
    
    if (fs.existsSync(sourceBackendPath)) {
      console.log('Source backend executable found, copying...');
      // 读取源文件
      const sourceContent = fs.readFileSync(sourceBackendPath);
      
      // 写入目标文件
      fs.writeFileSync(backendExe, sourceContent);
      console.log(`Successfully copied backend executable to: ${backendExe}`);
    } else {
      console.error(`ERROR: Source backend executable not found at: ${sourceBackendPath}`);
      console.error('Backend might not work properly in the packaged app!');
    }
  } else {
    console.log(`Backend executable already exists at: ${backendExe}`);
  }
  
  // 检查其他必要的后端文件(如 _internal 目录)
  const internalDir = path.join(backendPath, '_internal');
  if (!fs.existsSync(internalDir)) {
    const sourceInternalDir = path.resolve(process.cwd(), '..', 'Backend', 'dist', 'backend', '_internal');
    
    if (fs.existsSync(sourceInternalDir)) {
      console.log(`Copying internal directory from: ${sourceInternalDir}`);
      // 简单的目录复制方法（仅供参考，实际可能需要递归复制）
      fs.mkdirSync(internalDir, { recursive: true });
      
      try {
        // 列出源目录下所有文件
        const files = fs.readdirSync(sourceInternalDir);
        
        // 复制每个文件
        for (const file of files) {
          const sourcePath = path.join(sourceInternalDir, file);
          const destPath = path.join(internalDir, file);
          
          if (fs.statSync(sourcePath).isDirectory()) {
            console.log(`Skipping directory: ${sourcePath}`);
            continue;
          }
          
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Copied: ${file}`);
        }
        
        console.log('Successfully copied internal directory');
      } catch (err) {
        console.error(`Error copying internal directory: ${err.message}`);
      }
    }
  }
  
  console.log('afterPack script completed');
}; 