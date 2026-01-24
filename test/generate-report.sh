#!/usr/bin/env bash

# 测试报告生成脚本
# 用法: npm run test:report 或 ./test/generate-report.sh

echo "🧪 运行测试并生成报告..."

# 运行测试并保存结果
npm test -- --json --outputFile=/tmp/test-results.json --silent

# 提取测试统计信息 - Jest JSON 格式
TOTAL_TESTS=$(grep -o '"numTotalTests":[0-9]*' /tmp/test-results.json | cut -d: -f2)
PASSED_TESTS=$(grep -o '"numPassedTests":[0-9]*' /tmp/test-results.json | cut -d: -f2)
FAILED_TESTS=$(grep -o '"numFailedTests":[0-9]*' /tmp/test-results.json | cut -d: -f2)
SKIPPED_TESTS=$(grep -o '"numPendingTests":[0-9]*' /tmp/test-results.json | cut -d: -f2)

# 计算通过率
if [ "$TOTAL_TESTS" -gt 0 ]; then
  PASSED_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS / $TOTAL_TESTS) * 100}")
else
  PASSED_PERCENT="0"
fi

# 生成当前时间戳
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 输出结果
echo ""
echo "📊 测试结果摘要"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总测试用例: $TOTAL_TESTS"
echo "✅ 通过: $PASSED_TESTS"
echo "⏭️  跳过: $SKIPPED_TESTS"
echo "❌ 失败: $FAILED_TESTS"
echo "📈 通过率: $PASSED_PERCENT%"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 报告文件: test/report.html"
echo ""

# 打开报告
open test/report.html 2>/dev/null || echo "💡 请在浏览器中打开: file://$(pwd)/test/report.html"
