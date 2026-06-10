export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const categories: Category[] = [
  {
    id: "python",
    name: "Python 基础",
    icon: "🐍",
    color: "#3b82f6",
    description: "Python 语法、数据类型、列表、字典、集合、循环、函数等",
  },
  {
    id: "linux",
    name: "Linux 系统",
    icon: "🐧",
    color: "#10b981",
    description: "Linux 命令、目录结构、权限管理、进程、网络配置等",
  },
  {
    id: "ai",
    name: "AI 与机器学习",
    icon: "🧠",
    color: "#8b5cf6",
    description: "人工智能概念、机器学习、深度学习、大数据等",
  },
  {
    id: "sensor",
    name: "传感器与硬件",
    icon: "📡",
    color: "#f59e0b",
    description: "传感器原理、编码器、步进电机、履带与足式机器人等",
  },
  {
    id: "vision",
    name: "机器视觉",
    icon: "👁️",
    color: "#ec4899",
    description: "图像处理、相机原理、光源选择、边缘检测、深度相机等",
  },
  {
    id: "network",
    name: "网络基础",
    icon: "🌐",
    color: "#06b6d4",
    description: "网络协议、OSI模型、TCP/IP、负载均衡等",
  },
  {
    id: "ros",
    name: "ROS 机器人操作系统",
    icon: "🤖",
    color: "#84cc16",
    description: "ROS 工作空间、Catkin 编译系统、功能包管理等",
  },
  {
    id: "robotics",
    name: "机器人学",
    icon: "🦾",
    color: "#f97316",
    description: "运动学正逆问题、关节空间、末端执行器等",
  },
];

export const categoryMap = Object.fromEntries(
  categories.map((c) => [c.id, c])
);
