const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const presets = {
  "취학 전 아동": { "약함": [120, 7], "중간": [150, 5], "심함": [180, 4] },
  "초등학생": { "약함": [130, 7], "중간": [160, 5], "심함": [190, 4] },
  "중학생 이상": { "약함": [150, 7], "중간": [180, 5], "심함": [200, 4] }
};

function selected(name) {
  const active = document.querySelector(`[data-name="${name}"] button.active`);
  return active ? active.dataset.value : "";
}

function setSelected(name, value) {
  $$(`[data-name="${name}"] button`).forEach(btn => btn.classList.toggle("active", btn.dataset.value === value));
}

function updateRangeLabels() {
  const syllables = $("#syllables").value;
  const nd = Number($("#ratio").value);
  const ad = 10 - nd;
  $("#syllableText").textContent = syllables;
  $("#ratioText").textContent = `${nd} : ${ad}`;
}

function applyEasyPreset() {
  if (selected("mode") !== "easy") return;
  const age = selected("age");
  const severity = selected("severity");
  const [syllables, nd] = presets[age][severity];
  $("#syllables").value = syllables;
  $("#ratio").value = nd;
  updateRangeLabels();
}

function toggleMode() {
  const isEasy = selected("mode") === "easy";
  $$(".expert-field").forEach(el => el.style.opacity = isEasy ? "0.62" : "1");
  applyEasyPreset();
}

$$(".chips button, .segmented button").forEach(btn => {
  btn.addEventListener("click", () => {
    const group = btn.parentElement;
    group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    toggleMode();
  });
});

[$("#syllables"), $("#ratio")].forEach(input => input.addEventListener("input", updateRangeLabels));

function checkedAD() {
  const values = $$(".checks input:checked").map(input => input.value);
  return values.length ? values.join(", ") : "연장, 막힘, 1음절/음소 반복(R2)";
}

function generatePrompt() {
  const age = selected("age");
  const task = selected("task");
  const severity = selected("severity");
  const syllables = $("#syllables").value;
  const nd = Number($("#ratio").value);
  const ad = 10 - nd;
  const trap = selected("trap");
  const behavior = $("#behavior").value.trim() || "눈 깜빡임, 입술 꽉 다물기, 고개 젖힘, 발 구르기 등";
  const scene = $("#scene").value.trim() || `${task} 과제에 적절한 일상 장면`;

  return `너는 유창성 장애를 전문으로 다루는 1급 언어재활사야. 아래 조건과 파라다이스-유창성 검사-II(P-FA-II)의 채점 기준 및 규준을 반영하여 말더듬 발화 전사문을 작성해 줘.\n\n[조건]\n1. 대상 연령: ${age}\n2. 과제 유형: ${task}\n3. 장면/주제: ${scene}\n4. 말더듬 심한 정도: P-FA-II 해당 연령 규준표 기준 '${severity}' 수준\n5. 전체 목표 음절 수: 대략 ${syllables}음절 내외\n6. 비유창성 비율: 전체 비유창성 발생 횟수 중 정상적 비유창성(ND)과 비정상적 비유창성(AD)의 비율을 ND:AD = ${nd}:${ad}로 설정\n7. 포함할 핵심행동(AD): ${checkedAD()}가 골고루 포함되도록 구성\n8. 포함할 부수행동: ${behavior}\n9. 특이 사항(함정 문항): 겉보기에는 정상적 비유창성(ND)의 형태를 띠지만, P-FA-II 채점 규칙에 의해 비정상적 비유창성(AD)으로 채점되는 요소들을 ${trap}.\n   예: 3초 이상 지속되거나 긴장이 동반된 주저(Ha), 3회 이상 반복되는 간투사(Ia), 3회 이상 반복되는 다음절 반복(R1a) 등\n\n[작성 유의점]\n- 전사문은 실제 대상자가 말하는 것처럼 자연스럽게 작성해 줘.\n- 비유창성과 부수행동이 나타나는 부분은 괄호와 굵은 글씨로 명확하게 표시해 줘.\n- ND와 AD의 분류가 헷갈릴 수 있는 항목은 분석에서 반드시 근거를 설명해 줘.\n- 점수 산출 시 AD에는 가중치 1.5를 적용해 줘.\n- 공식 규준표 원문 수치가 필요한 경우에는 임상자가 최종 확인해야 한다는 안내를 포함해 줘.\n\n[출력 형식]\n아래 세 가지를 순서대로 출력해 줘.\n\n1. 전사문\n- 상황 설명\n- 대상자 발화 전사문\n- 총 목표 음절 수\n\n2. 비유창성 분석\n- ND 유형(I, H, R1, DP 등)과 횟수\n- AD 유형(R2, DP/막힘, 연장, Ha, Ia, R1a 등)과 횟수\n- ND:AD 비율 확인\n- 함정 문항이 포함된 경우 별도 해설\n\n3. 점수 산출 및 해석\n- ND 점수 = ND 횟수 / 총 음절 수 × 100\n- AD 점수 = AD 횟수 / 총 음절 수 × 100 × 1.5\n- 해당 과제 총점 = ND 점수 + AD 점수\n- 요청한 연령대와 심한 정도 '${severity}' 수준에 어떻게 부합하는지 설명\n- 실제 임상 적용 시 공식 P-FA-II 규준표와 최종 대조가 필요하다는 문구 포함`;
}

function showResult() {
  $("#promptOutput").value = generatePrompt();
  $("#emptyState").classList.add("hidden");
  $("#resultState").classList.remove("hidden");
}

async function copyPrompt() {
  const text = $("#promptOutput").value || generatePrompt();
  await navigator.clipboard.writeText(text);
  const toast = $("#toast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1600);
}

$("#generateBtn").addEventListener("click", showResult);
$("#copyBtn").addEventListener("click", copyPrompt);
$("#copyBtnBottom").addEventListener("click", copyPrompt);
$("#resetBtn").addEventListener("click", () => location.reload());

updateRangeLabels();
toggleMode();
