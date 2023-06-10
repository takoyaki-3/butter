import Butter from 'bus-time-table-by-edge-runtime/dist.js'

function formatDate (date, format) {
    format = format.replace(/yyyy/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/HH/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
    return format;
};

function addCalender() {
    let butter_tag_list = document.getElementsByClassName('butter-tag');
    for (let butter_tag of butter_tag_list) {
        const card = document.createElement('input');
        card.type = "date";
        card.className='date';

        let date = new Date();
        card.value = formatDate(date, 'yyyy-MM-dd')
        butter_tag.appendChild(card);
        card.addEventListener("input", addTimeTable);
    }
}

async function addTimeTable() {
    // 時刻表を追加
    let butter_tag_list = document.getElementsByClassName('butter-tag');
    let date = document.getElementsByClassName("date")[0].value.replace("-", "").replace("-", "");

    // 既存の時刻表を削除

    for (let butter_tag of butter_tag_list) {
        for (let i = butter_tag.children.length - 1; i >= 0; i--) {
            console.log(butter_tag.children[i]);
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
        console.log({ "ttFetched1": tt })
        // butter_tag.setAttribute("time_table")

        // 時刻表要素を追加
        tt.stop_times.forEach(st => {
            // 新しいHTML要素を作成
            const card = document.createElement('div');
            card.className='card';
            const box = document.createElement('div')
            const h = document.createElement('h2')
            h.textContent = st.stop_headsign;
            box.appendChild(h);
            var new_element = document.createElement('p');
            // if(textbox_element.getAttribute("how")=='hhmm')
            new_element.textContent = st.departure_time.slice(0,5)+' (+X min)';
            box.appendChild(new_element);
            box.className='box';
            card.appendChild(box);
            // 指定した要素の中の末尾に挿入
            butter_tag.appendChild(card);
          });
    }
}

const main = async () => {
    Butter.init();
    addCalender();
    addTimeTable();
}
main()
