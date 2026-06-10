import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync('C:/Users/qiaoc/AppData/Local/Temp/_3excise_backup/人工智能训练师高级理论考试.html', 'utf-8');

// Find the questions array
const match = html.match(/const questions = (\[.*?\]);/s);
if (!match) {
  console.error('Could not find questions array');
  process.exit(1);
}

const questions = JSON.parse(match[1]);

// Category classification rules based on keyword matching
function classify(q) {
  const text = q.text + ' ' + (q.options || []).map((o) => o.text).join(' ');

  // Linux keywords (check first because of overlap with Python)
  if (
    /Linux|ubuntu|Ubuntu|linux/.test(text) ||
    /chmod|chown|chmod|useradd|groupadd|passwd|ifconfig|ipconfig/.test(text) ||
    /\/etc|\/var|\/tmp|\/home|\/boot|\/dev|\/usr|\/sbin|\/bin/.test(text) ||
    /mkdir|grep|find|tar|rm -rf|ls|cat|cd|head|tail|ln|du|su |sudo/.test(text) ||
    /shell|Shell|init |inittab|EXT3|FAT|SWAP|NTFS|profile|bashrc/.test(text) ||
    /运行级别|宿主目录|属主|分区|进程ID|超级用户|普通用户|套接字/.test(text) ||
    /POSIX|Vi中|Vi 中|vim/.test(text)
  ) {
    return 'linux';
  }

  // ROS
  if (/ROS|catkin|ament|catkin_ws|rosbuild/i.test(text)) {
    return 'ros';
  }

  // 机器视觉
  if (
    /图像|图象|相机|CCD|CMOS|光源|纹理|边缘检测|滤波|算子|TOF|结构光|双目|视觉|帧率|像素|分辨率|拉普拉斯|傅立叶|灰度|二值化|直方图|信噪比/.test(
      text,
    ) ||
    /机器视觉/.test(text) ||
    /三原色|青|紫|橙|黄/.test(text)
  ) {
    return 'vision';
  }

  // 传感器
  if (
    /传感器|电容式|压电|编码器|测速发电机|步进电动机|履带|足式|陀螺仪|光敏|光码盘|光电|物性型|结构型|介电|极板|分辨率|半导体压电效应/.test(
      text,
    )
  ) {
    return 'sensor';
  }

  // 机器人学
  if (/操作机|关节空间|操作空间|迪卡尔|运动正问题|运动逆问题|终端效应器|机器人手部|位姿/.test(text)) {
    return 'robotics';
  }

  // 网络
  if (
    /TCP|OSI|网络协议|七层网络|四层网络|网络模型|应用层|表示层|会话层|传输层|网络层|数据链路|物理层|负载|域名|IP地址|hosts/.test(
      text,
    ) ||
    /计算机网络/.test(text)
  ) {
    return 'network';
  }

  // AI
  if (
    /人工智能|机器学习|深度学习|神经网络|神经元|决策树|K近邻|贝叶斯|类脑|专家系统|强人工智能|弱人工智能|通用人工智能|专用人工智能|GAN|图像识别|脸部识别|智能客服|大数据|互联网\+|云计算|物联网|数据清/.test(
      text,
    ) ||
    /Tomaso Poggio|MIT|梯度下降|预先训练|fine tune|RAM中同时处理|代码的设计原则|轨迹跟踪|数据挖掘|机器视觉算法|工业应用/.test(
      text,
    )
  ) {
    return 'ai';
  }

  // Python (default catch for Python-y content)
  if (
    /Python|python|pip|whl|IPython|UTF-8|GBK|CP936|ASCII|Unicode|二进制|十六进制|八进制|complex|列表|字典|集合|元组|字符串|布尔|序列|缩进|注释|input\(\)|print\(|append|insert|remove|pop|del |range|for |while |if |else|break|continue|lambda|/.test(
      text,
    ) ||
    /\bint\b|\bfloat\b|\bbool\b|\bNone\b|\bFlase\b|\bTrue\b/.test(text) ||
    /a=|b=|a\+|a\*|a%|a\*\*|a\/\/|x = |x\.|[a-z] = \[/.test(text)
  ) {
    return 'python';
  }

  return 'misc';
}

// Generate explanation
function generateExplanation(q) {
  if (q.type === 'tf') {
    return q.answer === '√'
      ? '该表述正确。'
      : '该表述错误。';
  }
  const labels = q.answer.split('');
  const texts = labels.map((label) => {
    const opt = q.options.find((o) => o.label === label);
    return opt ? `${label}. ${opt.text}` : label;
  });
  if (q.type === 'single') {
    return `正确答案是 ${texts.join('、')}。`;
  }
  return `正确答案是 ${labels.join('')}，即：${texts.join('；')}。`;
}

const enriched = questions.map((q) => ({
  ...q,
  category: classify(q),
  explanation: generateExplanation(q),
}));

// Print category distribution
const dist = {};
enriched.forEach((q) => {
  dist[q.category] = (dist[q.category] || 0) + 1;
});
console.log('Category distribution:', dist);

// Write
const outPath = 'src/data/questions.json';
fs.writeFileSync(outPath, JSON.stringify(enriched, null, 2), 'utf-8');
console.log(`Wrote ${enriched.length} questions to ${outPath}`);

// Print 'misc' items for review
console.log('\nMisc items:');
enriched
  .filter((q) => q.category === 'misc')
  .forEach((q) => console.log(`  #${q.id}: ${q.text.slice(0, 60)}`));
