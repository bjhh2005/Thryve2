from .MessageNode import MessageNode
import os
from typing import Dict, Any, List
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
import io

class ImageProcessor(MessageNode):
    def __init__(self, id: str, type: str, nextNodes: List, eventBus, data: Dict):
        """
        初始化图像处理节点
        
        Args:
            id (str): 节点ID
            type (str): 节点类型
            nextNodes (list): 下一个节点列表
            eventBus: 事件总线
            data (dict): 节点数据
        """
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.mode = data.get('mode', '')
        self.input_file = None
        
        # 获取输出路径配置
        self.output_folder = self._get_input_value(data, 'outputFolder') or "output"
        self.output_name = self._get_input_value(data, 'outputName') or "output"
        
        # 确保输出目录存在
        if not os.path.exists(self.output_folder):
            os.makedirs(self.output_folder)

    def _get_input_value(self, data: Dict[str, Any], key: str) -> Any:
        """从inputsValues中获取值，处理constant和ref两种类型"""
        if key not in data.get('inputsValues', {}):
            return None
        
        value_data = data['inputsValues'][key]
        if value_data.get("type") == "constant":
            return value_data.get("content")
        elif value_data.get("type") == "ref":
            content = value_data.get("content", [])
            if len(content) >= 2:
                node_id = content[0]
                if node_id.endswith("_locals"):
                    node_id = node_id[:-7]
                param_name = content[1]
                return self._eventBus.emit("askMessage", node_id, param_name)
        return None

    def run(self) -> bool:
        """
        执行图像处理节点
        
        Returns:
            bool: 执行是否成功
        """
        try:
            # 从data中获取输入文件
            self.input_file = self._get_input_value(self.data, 'inputFile')
            
            # 根据不同模式执行相应操作
            if self.mode == 'resize':
                result = self._resize_image()
            elif self.mode == 'compress':
                result = self._compress_image()
            elif self.mode == 'convert':
                result = self._convert_image()
            elif self.mode == 'rotate':
                result = self._rotate_image()
            elif self.mode == 'crop':
                result = self._crop_image()
            elif self.mode == 'filter':
                result = self._apply_filter()
            elif self.mode == 'watermark':
                result = self._add_watermark()
            else:
                raise ValueError(f"不支持的操作模式: {self.mode}")

            # 更新消息
            self.MessageList = result
            
            # 更新下一个节点
            self.updateNext()
            return True
            
        except Exception as e:
            raise Exception(f"图像处理节点 {self._id} 执行错误: {str(e)}")

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            raise Exception(f"节点 {self._id}: 缺少后续节点配置")
        self._next = self._nextNodes[0][1]

    def _resize_image(self) -> Dict[str, Any]:
        """调整图像大小"""
        try:
            width = self._get_input_value(self.data, 'width')
            height = self._get_input_value(self.data, 'height')
            maintain_aspect_ratio = self._get_input_value(self.data, 'maintainAspectRatio')or False

            # 打开图像
            image = Image.open(self.input_file)
            original_width, original_height = image.size

            # 计算新尺寸
            if maintain_aspect_ratio:
                ratio = min(width / original_width, height / original_height)
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)
            else:
                new_width = width
                new_height = height

            # 调整大小
            resized_image = image.resize((new_width, new_height), Image.LANCZOS)

            # 保存结果
            output_file = os.path.join(self.output_folder, f"{self.output_name}{os.path.splitext(self.input_file)[1]}")
            resized_image.save(output_file)

            # 获取处理后的图像信息
            processed_info = {
                "processedImage": output_file,
                "width": new_width,
                "height": new_height,
                "format": resized_image.format,
                "size": os.path.getsize(output_file)
            }

            self._eventBus.emit("message", "info", self._id, "image resized success!")
            return processed_info

        except Exception as e:
            raise RuntimeError(f"调整图像大小时发生错误: {str(e)}")

    def _compress_image(self) -> Dict[str, Any]:
        """压缩图像"""
        try:
            quality = self._get_input_value(self.data, 'quality')

            # 打开图像
            image = Image.open(self.input_file)
            
            # 确保图像为RGB模式
            if image.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[3])
                else:
                    background.paste(image, mask=image.split()[1])
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')

            # 保存压缩后的图像
            output_file = os.path.join(self.output_folder, f"{self.output_name}.jpg")
            image.save(output_file, 'JPEG', quality=quality, optimize=True)

            # 获取处理后的图像信息
            processed_info = {
                "processedImage": output_file,
                "width": image.width,
                "height": image.height,
                "format": "JPEG",
                "size": os.path.getsize(output_file)
            }

            self._eventBus.emit("message", "info", self._id, "image compressed success!")
            return processed_info

        except Exception as e:
            raise RuntimeError(f"压缩图像时发生错误: {str(e)}")

    def _convert_image(self) -> Dict[str, Any]:
        """转换图像格式"""
        try:
            format = self._get_input_value(self.data, 'format')
            quality = self._get_input_value(self.data, 'quality')

            # 打开图像
            image = Image.open(self.input_file)

            # 转换格式
            if format == 'jpeg' and image.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[3])
                else:
                    background.paste(image, mask=image.split()[1])
                image = background

            # 保存转换后的图像
            output_file = os.path.join(self.output_folder, f"{self.output_name}.{format}")
            image.save(output_file, format.upper(), quality=quality)

            # 获取处理后的图像信息
            processed_info = {
                "processedImage": output_file,
                "width": image.width,
                "height": image.height,
                "format": format.upper(),
                "size": os.path.getsize(output_file)
            }

            self._eventBus.emit("message", "info", self._id, "image format converted success!")
            return processed_info

        except Exception as e:
            raise RuntimeError(f"转换图像格式时发生错误: {str(e)}")

    def _rotate_image(self) -> Dict[str, Any]:
        """旋转图像"""
        try:
            angle = self._get_input_value(self.data, 'angle')

            # 打开图像
            image = Image.open(self.input_file)

            # 旋转图像
            rotated_image = image.rotate(angle, expand=True)

            # 保存旋转后的图像
            output_file = os.path.join(self.output_folder, f"{self.output_name}{os.path.splitext(self.input_file)[1]}")
            rotated_image.save(output_file)

            # 获取处理后的图像信息
            processed_info = {
                "processedImage": output_file,
                "width": rotated_image.width,
                "height": rotated_image.height,
                "format": rotated_image.format,
                "size": os.path.getsize(output_file)
            }

            self._eventBus.emit("message", "info", self._id, "image rotated success!")
            return processed_info

        except Exception as e:
            raise RuntimeError(f"旋转图像时发生错误: {str(e)}")

    def _crop_image(self) -> Dict[str, Any]:
        """裁剪图像"""
        try:
            x = self._get_input_value(self.data, 'x')
            y = self._get_input_value(self.data, 'y')
            width = self._get_input_value(self.data, 'width')
            height = self._get_input_value(self.data, 'height')

            # 打开图像
            image = Image.open(self.input_file)

            # 裁剪图像
            cropped_image = image.crop((x, y, x + width, y + height))

            # 保存裁剪后的图像
            output_file = os.path.join(self.output_folder, f"{self.output_name}{os.path.splitext(self.input_file)[1]}")
            cropped_image.save(output_file)

            # 获取处理后的图像信息
            processed_info = {
                "processedImage": output_file,
                "width": cropped_image.width,
                "height": cropped_image.height,
                "format": cropped_image.format,
                "size": os.path.getsize(output_file)
            }

            self._eventBus.emit("message", "info", self._id, "image cropped success!")
            return processed_info

        except Exception as e:
            raise RuntimeError(f"裁剪图像时发生错误: {str(e)}")

    def _apply_filter(self) -> Dict[str, Any]:
        """应用滤镜效果"""
        try:
            filter_type = self._get_input_value(self.data, 'filterType')
            intensity = self._get_input_value(self.data, 'intensity') / 100.0  # 转换为0-1范围

            # 打开图像
            image = Image.open(self.input_file)

            # 应用滤镜
            if filter_type == 'grayscale':
                filtered_image = image.convert('L')
            elif filter_type == 'sepia':
                # 创建棕褐色效果
                width, height = image.size
                pixels = image.load()
                filtered_image = Image.new('RGB', (width, height))
                for x in range(width):
                    for y in range(height):
                        r, g, b = pixels[x, y][:3]
                        tr = int(0.393*r + 0.769*g + 0.189*b)
                        tg = int(0.349*r + 0.686*g + 0.168*b)
                        tb = int(0.272*r + 0.534*g + 0.131*b)
                        filtered_image.putpixel((x, y), (min(tr, 255), min(tg, 255), min(tb, 255)))
            elif filter_type == 'blur':
                filtered_image = image.filter(ImageFilter.GaussianBlur(radius=intensity * 10))
            elif filter_type == 'sharpen':
                filtered_image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=intensity * 150))
            elif filter_type == 'brightness':
                enhancer = ImageEnhance.Brightness(image)
                filtered_image = enhancer.enhance(1 + intensity)
            elif filter_type == 'contrast':
                enhancer = ImageEnhance.Contrast(image)
                filtered_image = enhancer.enhance(1 + intensity)
            else:
                raise ValueError(f"不支持的滤镜类型: {filter_type}")

            # 保存处理后的图像
            output_file = os.path.join(self.output_folder, f"{self.output_name}{os.path.splitext(self.input_file)[1]}")
            filtered_image.save(output_file)

            # 获取处理后的图像信息
            processed_info = {
                "processedImage": output_file,
                "width": filtered_image.width,
                "height": filtered_image.height,
                "format": filtered_image.format or image.format,
                "size": os.path.getsize(output_file)
            }

            self._eventBus.emit("message", "info", self._id, "filter applied success!")
            return processed_info

        except Exception as e:
            raise RuntimeError(f"应用滤镜效果时发生错误: {str(e)}")

    def _add_watermark(self) -> Dict[str, Any]:
        """添加水印"""
        try:
            watermark_text = self._get_input_value(self.data, 'watermarkText')
            font_size = self._get_input_value(self.data, 'fontSize')
            opacity = self._get_input_value(self.data, 'opacity') / 100.0  # 转换为0-1范围
            position = self._get_input_value(self.data, 'position')

            # 打开图像
            image = Image.open(self.input_file)
            
            # 创建一个透明的图层用于水印
            watermark = Image.new('RGBA', image.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(watermark)

            # 尝试加载字体，如果失败则使用默认字体
            try:
                # 尝试多个中文字体
                font_paths = [
                    "C:\\Windows\\Fonts\\simhei.ttf",  # 黑体
                    "C:\\Windows\\Fonts\\simsun.ttc",  # 宋体
                    "C:\\Windows\\Fonts\\msyh.ttc",    # 微软雅黑
                    "arial.ttf"  # 回退到英文字体
                ]
                font = None
                for font_path in font_paths:
                    try:
                        font = ImageFont.truetype(font_path, font_size)
                        break
                    except:
                        continue
                
                if font is None:
                    font = ImageFont.load_default()
                    self._eventBus.emit("message", "warning", self._id, "未找到合适的字体，使用默认字体")
            except:
                font = ImageFont.load_default()
                self._eventBus.emit("message", "warning", self._id, "加载字体失败，使用默认字体")

            # 获取文本大小
            text_bbox = draw.textbbox((0, 0), watermark_text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]

            # 计算水印位置
            if position == 'center':
                x = (image.width - text_width) // 2
                y = (image.height - text_height) // 2
            elif position == 'topLeft':
                x = 10
                y = 10
            elif position == 'topRight':
                x = image.width - text_width - 10
                y = 10
            elif position == 'bottomLeft':
                x = 10
                y = image.height - text_height - 10
            else:  # bottomRight
                x = image.width - text_width - 10
                y = image.height - text_height - 10

            # 绘制水印文本 - 修改颜色和透明度
            # 使用红色作为水印颜色，提高不透明度
            red_color = (255, 0, 0, int(255 * opacity))  # 红色水印
            draw.text((x, y), watermark_text, font=font, fill=red_color)

            # 将水印合并到原图
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            watermarked = Image.alpha_composite(image, watermark)

            # 保存结果
            output_file = os.path.join(self.output_folder, f"{self.output_name}{os.path.splitext(self.input_file)[1]}")
            # 转换为RGB模式并保存
            if watermarked.mode == 'RGBA':
                rgb_image = Image.new('RGB', watermarked.size, (255, 255, 255))
                rgb_image.paste(watermarked, mask=watermarked.split()[3])
                rgb_image.save(output_file)
            else:
                watermarked.save(output_file)

            # 获取处理后的图像信息
            processed_info = {
                "processedImage": output_file,
                "width": watermarked.width,
                "height": watermarked.height,
                "format": watermarked.format or image.format,
                "size": os.path.getsize(output_file)
            }

            self._eventBus.emit("message", "info", self._id, "watermark added success!")
            return processed_info

        except Exception as e:
            raise RuntimeError(f"添加水印时发生错误: {str(e)}")
