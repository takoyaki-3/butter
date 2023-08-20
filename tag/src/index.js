import Butter from "butter-lib/dist.js"

function formatDate(date, format) {
  format = format.replace(/yyyy/g, date.getFullYear());
  format = format.replace(/MM/g, ("0" + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/dd/g, ("0" + date.getDate()).slice(-2));
  format = format.replace(/HH/g, ("0" + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ("0" + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ("0" + date.getSeconds()).slice(-2));
  format = format.replace(/SSS/g, ("00" + date.getMilliseconds()).slice(-3));
  return format;
}

async function addStopName(){
  const butter_tag_list = document.getElementsByClassName("butter-tag");
  for (let butter_tag of butter_tag_list) {
    const gtfs_id = butter_tag.getAttribute("gtfs_id");
    const stop_ids = butter_tag.getAttribute("stop_ids");
    const info = await Butter.getDataInfo(gtfs_id);
    const e = document.createElement("h2");
    let date = document.getElementsByClassName("date")[0].value.replace("-", "").replace("-", "");
    let tt = await Butter.fetchTimeTableV1(gtfs_id, {
      date: date,
      stop_ids: JSON.parse(stop_ids)
    })
    if(tt.stop_times.length==0) continue;
    const stopName = tt.stop_times[0].stop_name;
    e.innerText = `${stopName} (${info.name})`;
    butter_tag.appendChild(e)
  }
}

function addCalender() {
  // 日付選択カレンダーを表示
  let butter_tag_list = document.getElementsByClassName("butter-tag");
  for (let butter_tag of butter_tag_list) {
    const date = document.createElement("input");
    date.type = "date";
    date.className = "date";

    let today = new Date();
    date.value = formatDate(today, "yyyy-MM-dd")
    butter_tag.appendChild(date);

    // 日付が選択されたらTimeTableを更新
    date.addEventListener("input", addTimeTable);
    date.addEventListener("input", addInfo);
  }
}

async function addInfo() {
  // バス会社などを表示
  let butter_tag_list = document.getElementsByClassName("butter-tag");
  for (let butter_tag of butter_tag_list) {
    for (let i = butter_tag.children.length - 1; i >= 0; i--) {
      if (butter_tag.children[i].className == "info") {
        butter_tag.removeChild(butter_tag.lastChild);
      }
    }

    let gtfs_id = butter_tag.getAttribute("gtfs_id");
    const info = await Butter.getDataInfo(gtfs_id);
    const info_element = document.createElement("div");
    // info_element.className = "info";
    // info_element.textContent = `${info.head_sign}, ${info.name}, ${info.license}, last-update: ${info.updatedAt}`;
    info_element.textContent = `${info.name}, ${info.license}, last-update: ${info.updatedAt}`;
    butter_tag.appendChild(info_element);
  }
}

async function addOption() {
  // オプションの設定（次のバスから表示or始発から表示、最大何件表示するか）
  let butter_tag_list = document.getElementsByClassName("butter-tag");
  for (let butter_tag of butter_tag_list) {
    const display_time_select = document.createElement("select");
    display_time_select.className = "is_first_bus";
    const display_time_option1 = document.createElement("option");
    const display_time_option2 = document.createElement("option");
    display_time_option1.value = "1";
    display_time_option1.text = "表示: 始発〜";
    display_time_option2.value = "2";
    display_time_option2.text = "表示: 現在時刻〜";
    display_time_select.add(display_time_option1);
    display_time_select.add(display_time_option2);
    butter_tag.appendChild(display_time_select);
    display_time_select.addEventListener("change", addTimeTable);

    const display_max_select = document.createElement("select");
    display_max_select.className = "display_max_num";
    const display_max_option1 = document.createElement("option");
    const display_max_option2 = document.createElement("option");
    const display_max_option3 = document.createElement("option");
    display_max_option1.value = 10;
    display_max_option1.text = "表示件数: 10件";
    display_max_option2.value = 50;
    display_max_option2.text = "表示件数: 50件";
    display_max_option3.value = Infinity;
    display_max_option3.text = "表示件数: すべて";
    display_max_select.add(display_max_option1);
    display_max_select.add(display_max_option2);
    display_max_select.add(display_max_option3);
    butter_tag.appendChild(display_max_select);
    display_max_select.addEventListener("change", addTimeTable);
  }
}

async function addTimeTable() {
  // 時刻表を追加
  let butter_tag_list = document.getElementsByClassName("butter-tag");
  let date = document.getElementsByClassName("date")[0].value.replace("-", "").replace("-", "");

  for (let butter_tag of butter_tag_list) {
    // 既存の時刻表を削除
    for (let i = butter_tag.children.length - 1; i >= 0; i--) {
      if (butter_tag.children[i].className == "card") {
        butter_tag.removeChild(butter_tag.lastChild);
      }
    }

    let gtfs_id = butter_tag.getAttribute("gtfs_id");
    let stop_ids = butter_tag.getAttribute("stop_ids");

    // 時刻表情報の取得
    let tt = await Butter.fetchTimeTableV1(gtfs_id, {
      date: date,
      stop_ids: JSON.parse(stop_ids)
    })

    let is_first_bus = butter_tag.getElementsByClassName("is_first_bus")[0].options[0].selected;
    let threshold_cnt = butter_tag.getElementsByClassName("display_max_num")[0].value;

    let cnt = 0;
    // 時刻表要素を追加
    tt.stop_times.forEach(st => {
      // 表示件数
      if (cnt >= threshold_cnt) return;

      // 始発からかどうか
      let threshold_time = parseInt(st.departure_time.slice(0, 2)) * 60 + parseInt(st.departure_time.slice(3, 5))
      let now_time = new Date();
      if (!is_first_bus && threshold_time < now_time.getHours() * 60 + now_time.getMinutes()) return;

      // 新しいHTML要素を作成
      const tt_card = document.createElement("div");
      tt_card.className = "card";
      const box = document.createElement("div")
      const h = document.createElement("p")
      h.innerText = st.headsign +"\n" + st.departure_time.slice(0, 5);
      box.appendChild(h);
      // let new_element = document.createElement("p");
      // new_element.textContent = st.departure_time.slice(0, 5);// + " (+X min)";
      // box.appendChild(new_element);
      // box.className = "box";
      tt_card.appendChild(box);
      // 指定した要素の中の末尾に挿入
      butter_tag.appendChild(tt_card);
      cnt += 1;
    });
  }
}

const main = async () => {
  Butter.init();
  addStopName();
  addCalender();
  addOption();
  addTimeTable();
  addInfo();
}
main()
