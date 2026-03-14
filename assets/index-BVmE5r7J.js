(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const parseStringToNumber = (userInput) => {
  return Number(userInput);
};
const LOTTO_INTO = Object.freeze({
  LOTTO_NUMBER_COUNT: 6,
  LOTTO_MAX_NUMBER: 45,
  LOTTO_MIN_NUMBER: 1
});
const PRIZE_PER_RANK = Object.freeze({
  1: 2e9,
  2: 3e7,
  3: 15e5,
  4: 5e4,
  5: 5e3
});
const generateRandomNumbers = () => {
  const randomSet = /* @__PURE__ */ new Set();
  while (randomSet.size < LOTTO_INTO.LOTTO_NUMBER_COUNT) {
    randomSet.add(
      Math.floor(Math.random() * LOTTO_INTO.LOTTO_MAX_NUMBER) + LOTTO_INTO.LOTTO_MIN_NUMBER
    );
  }
  return Array.from(randomSet);
};
const validateNumber = (userInput) => {
  if (Number.isNaN(userInput)) throw new Error("[ERROR] 숫자를 입력해주세요");
  if (!Number.isFinite(userInput))
    throw new Error("[ERROR] 유효한 숫자를 입력해주세요");
  return userInput;
};
const validateRange = (number) => {
  if (number > LOTTO_INTO.LOTTO_MAX_NUMBER)
    throw new Error("[ERROR] 로또 번호는 45이하의 숫자로 입력해주세요");
  if (number < LOTTO_INTO.LOTTO_MIN_NUMBER)
    throw new Error("[ERROR] 로또 번호는 1이상의 숫자로 입력해주세요");
  return number;
};
const validateNoDuplicate = (lottoNumbers) => {
  if (lottoNumbers.length !== new Set(lottoNumbers).size)
    throw new Error("[ERROR] 로또 번호는 중복되지 않는 숫자로 입력해주세요");
  return lottoNumbers;
};
const validateCount = (lottoNumbers) => {
  if (lottoNumbers.length !== 6)
    throw new Error("[ERROR] 로또는 6개의 숫자로 이루어져야 합니다.");
  return lottoNumbers;
};
const validatePositive = (number) => {
  if (number < 0) throw new Error("[ERROR] 양수만 입력해주세요");
  return number;
};
const validateUnit = (purchaseAmount) => {
  if (purchaseAmount % 1e3 !== 0)
    throw new Error("[ERROR] 1000 단위의 숫자로 입력해주세요");
  return purchaseAmount;
};
const validatePurchaseAmount = (number) => {
  validateNumber(number);
  validatePositive(number);
  validateUnit(number);
  return number;
};
const validateLottoNumbers = (lottoNumbers) => {
  validateNoDuplicate(lottoNumbers);
  validateCount(lottoNumbers);
  lottoNumbers.forEach((lottoNumber) => {
    validateNumber(lottoNumber);
    validateRange(lottoNumber);
  });
  return lottoNumbers;
};
const validateBonusNumber = (bonusNumber, winningNumbers) => {
  validateNumber(bonusNumber);
  validateRange(bonusNumber);
  if (winningNumbers.includes(bonusNumber))
    throw new Error("[ERROR] 보너스 번호는 당첨 번화와 중복될 수 없습니다.");
  return bonusNumber;
};
class Lotto {
  constructor(lottoNumberList) {
    this.#validate(lottoNumberList);
    this.numbers = [...lottoNumberList].sort((a, b) => a - b);
  }
  #validate(numbers) {
    validateCount(numbers);
    validateNoDuplicate(numbers);
    numbers.forEach((number) => validateRange(number));
  }
  getNumbers() {
    return [...this.numbers];
  }
}
class PurchasedLotto {
  #lottos;
  constructor(lottoNumbersList) {
    if (!Array.isArray(lottoNumbersList) || lottoNumbersList.some((arr) => !Array.isArray(arr)))
      throw new Error("[ERROR]");
    this.#lottos = lottoNumbersList.map(
      (lottoNumbers) => new Lotto(lottoNumbers)
    );
  }
  getLottos() {
    return this.#lottos;
  }
  getLottoCount() {
    return this.#lottos.length;
  }
  getPrizeList(winningLotto) {
    const prizeList = [0, 0, 0, 0, 0, 0];
    this.#lottos.forEach((lotto) => {
      const rank = winningLotto.getRank(lotto);
      if (rank !== null && rank >= 1 && rank <= 5) prizeList[rank] += 1;
    });
    return prizeList;
  }
}
class WinningLotto extends Lotto {
  constructor(numbers, bonus) {
    super(numbers);
    validateLottoNumbers(numbers);
    validateBonusNumber(bonus, numbers);
    this.bonusNumber = bonus;
  }
  getBonusNumber() {
    return this.bonusNumber;
  }
  getRank(lotto) {
    const matchingCount = this.#countMatches(lotto);
    const isBonus = this.#isBonus(lotto);
    if (matchingCount === 6) return 1;
    if (matchingCount === 5 && isBonus) return 2;
    if (matchingCount === 5) return 3;
    if (matchingCount === 4) return 4;
    if (matchingCount === 3) return 5;
    return null;
  }
  #countMatches(lotto) {
    return lotto.getNumbers().filter((x) => this.numbers.includes(x)).length;
  }
  #isBonus(lotto) {
    return lotto.getNumbers().includes(this.bonusNumber);
  }
}
const getReturnRate = (prizeList, purchaseAmount) => {
  const totalPrize = prizeList.reduce((acc, count, rank) => {
    const prizeMoney = PRIZE_PER_RANK[rank] || 0;
    return acc + count * prizeMoney;
  }, 0);
  return Math.round(totalPrize / purchaseAmount * 100 * 10) / 10;
};
class WebLottoManager {
  #purchasedLotto = null;
  #purchaseAmount = 0;
  #generateRandomNumbers;
  constructor(generateRandomNumbers2) {
    this.#generateRandomNumbers = generateRandomNumbers2;
  }
  purchase(amount) {
    validatePurchaseAmount(amount);
    this.#purchaseAmount = amount;
    const numbers = Array.from(
      { length: amount / 1e3 },
      this.#generateRandomNumbers
    );
    this.#purchasedLotto = new PurchasedLotto(numbers);
    return {
      count: this.#purchaseAmount / 1e3,
      lottos: this.#purchasedLotto.getLottos()
    };
  }
  getResult(winningNumbers, bonusNumber) {
    if (this.#purchaseAmount === 0 || this.#purchasedLotto === null)
      throw new Error("[ERROR]");
    const winningLotto = new WinningLotto(winningNumbers, bonusNumber);
    const prizeList = [0, 0, 0, 0, 0, 0];
    this.#purchasedLotto.getLottos().forEach((lotto) => {
      const rank = winningLotto.getRank(lotto);
      if (rank !== null && rank >= 1 && rank <= 5) prizeList[rank] += 1;
    });
    return {
      prizeList,
      roi: getReturnRate(prizeList, this.#purchaseAmount)
    };
  }
  reset() {
    this.#purchasedLotto = null;
    this.#purchaseAmount = 0;
  }
}
const dom = {
  purchaseBtn: document.getElementById("purchase-amount-button"),
  purchaseInput: document.getElementById("purchase-amount-input"),
  purchasedLottoSection: document.getElementById("purchased-lotto-section"),
  winningSection: document.getElementById("winning-section"),
  winningNumberInputs: document.querySelectorAll(
    ".winning-number-input-container .number-each"
  ),
  bonusNumberInput: document.getElementById("bonus-number"),
  resultBtn: document.getElementById("result-btn"),
  modalOverlay: document.getElementById("modal-overlay"),
  restartBtn: document.getElementById("restart-btn"),
  stats: {
    1: document.getElementById("stat-1"),
    2: document.getElementById("stat-2"),
    3: document.getElementById("stat-3"),
    4: document.getElementById("stat-4"),
    5: document.getElementById("stat-5")
  },
  roiText: document.getElementById("roi-text"),
  purchaseError: document.getElementById("purchase-error"),
  winningError: document.getElementById("winning-error")
};
const renderPurchaseLottos = (count, lottos) => {
  dom.purchasedLottoSection.innerHTML = `
  <p class="body-text">총 ${count}개를 구매하였습니다.</p>
  <div class='lotto-numbers-container'>
  ${lottos.map(
    (lotto) => `<p class='lotto-number-line'><span class='lotto-emoji'>🎟️</span><span class='lotto-numbers'>${lotto.getNumbers().join(", ")}</span></p>`
  ).join("")}
  </div>`;
  dom.winningSection.classList.remove("hidden");
};
const renderResultModal = (prizeList, roi) => {
  [1, 2, 3, 4, 5].forEach((rank) => {
    dom.stats[rank].textContent = `${prizeList[rank]}개`;
  });
  dom.roiText.textContent = `당신의 총 수익률은 ${roi}%입니다.`;
  dom.modalOverlay.classList.remove("hidden");
};
const resetDOM = () => {
  dom.purchasedLottoSection.innerHTML = "";
  dom.winningSection.classList.add("hidden");
  dom.modalOverlay.classList.add("hidden");
  dom.purchaseInput.value = "";
  dom.winningNumberInputs.forEach((input) => input.value = "");
  dom.bonusNumberInput.value = "";
};
const renderErrorMessage = (errorEle, errorMsg) => {
  errorEle.textContent = errorMsg;
};
const removeErrorMessage = (errorEle) => {
  errorEle.textContent = "";
};
const webLottoManager = new WebLottoManager(generateRandomNumbers);
dom.purchaseBtn.addEventListener("click", (e) => {
  e.preventDefault();
  try {
    const amount = parseStringToNumber(dom.purchaseInput.value);
    const { count, lottos } = webLottoManager.purchase(amount);
    renderPurchaseLottos(count, lottos);
    removeErrorMessage(dom.purchaseError);
  } catch (error) {
    renderErrorMessage(dom.purchaseError, error.message);
  }
});
dom.resultBtn.addEventListener("click", () => {
  const winningNumbers = [...dom.winningNumberInputs].map(
    (input) => parseStringToNumber(input.value)
  );
  const bonusNumber = parseStringToNumber(dom.bonusNumberInput.value);
  try {
    const { prizeList, roi } = webLottoManager.getResult(
      winningNumbers,
      bonusNumber
    );
    renderResultModal(prizeList, roi);
    removeErrorMessage(dom.winningError);
  } catch (error) {
    renderErrorMessage(dom.winningError, error.message);
  }
});
dom.restartBtn.addEventListener("click", () => {
  webLottoManager.reset();
  resetDOM();
});
