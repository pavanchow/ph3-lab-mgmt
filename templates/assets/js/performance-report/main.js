'use strict';

document.addEventListener('DOMContentLoaded', async function() {

	function clear() {
		document.getElementById('mobile').innerHTML = '';
		document.getElementById('desktop').innerHTML = '';
		document.getElementById('gscStatus').innerHTML = '';
		document.getElementById('gscIssues').innerHTML = '';
	};

	function isElement(element) {
		return element instanceof Element || element instanceof HTMLDocument;
	};

	async function changeActive(elem) {
		const siblingTabs = elem.parentNode.children, subtabs = document.getElementById(elem.id + 'SubTabs');
		Object.keys(siblingTabs).forEach((key, i) => {
			siblingTabs[key].classList.remove('is-active');
		});

		elem.classList.add('is-active');
		if(isElement(active) && !active.contains(elem))
		{
			active.classList.add('no-show');
			active.style.display = 'none';
			active = {};
		}

		if(subtabs === null)
		{
			if(!(elem.id in reports))
			{
				document.getElementById('loader').style.display = 'block';
				clear();
			}

			else
			{
				document.getElementById('loader').style.display = 'none';
				populate(elem.id, reports[elem.id]);
			}
		}

		else
		{
			subtabs.classList.remove('no-show');
			subtabs.style.display = 'block';
			active = subtabs;

			const currTabs = document.getElementsByClassName('is-active');
			Object.keys(currTabs).forEach((key, ind) => {
				if(subtabs.contains(currTabs[key]))
				{
					changeActive(currTabs[key]);
				}
			});
		}
	};

	function populate(link, report) {
		lighthousePopulate(link, report['lighthouse']);
		gscPopulate(link, report['gsc']);
	};

	const sessionStorage = window.sessionStorage, tabs = document.getElementsByClassName('v-tabs'), colors = ['red', 'orange', 'green'];
	let active = {}, luColors = {};
	const [pages, LUs] = parse(tabs);

	const subArrs = splitToChunks(pages, 5), reports = {};
	const promises = subArrs.map(async (pages, i) => {
		for(let i = 0; i < pages.length; i += 1)
		{
			const report = JSON.parse(sessionStorage.getItem(pages[i]));
			if(report !== null && Object.keys(report.gsc).length && Object.keys(report.lighthouse).length)
			{
				reports[pages[i]] = {...report};
			}

			else
			{
				const lighthouseRes = await lighthouseApi(pages[i], commonData.apiKeys['lighthouse']), gscRes = await gscApi(pages[i], commonData.apiKeys['gsc']);
				reports[pages[i]] = {
					lighthouse: {...lighthouseRes},
					gsc: {...gscRes}
				};

				sessionStorage.setItem(pages[i], JSON.stringify(reports[pages[i]]));
			}

			const mobPerfScore = reports[pages[i]]['lighthouse']['mobile']['Scores']['performance'], tab = document.getElementById(pages[i]), currColor = colorScheme(mobPerfScore);
			let parentLU = null;

			LUs.forEach((lu, ix) => {
				const luElem = document.getElementById(lu + 'SubTabs');
				if(luElem.contains(tab))
				{
					parentLU = document.getElementById(lu);
					if(!(lu in luColors))
					{
						luColors[lu] = currColor;
						parentLU.children[0].children[0].classList.add(colors[currColor]);
					}

					else if(luColors[lu] > currColor)
					{
						parentLU.children[0].children[0].classList.remove(colors[luColors[lu]]);
						luColors[lu] = currColor;
						parentLU.children[0].children[0].classList.add(colors[currColor]);
					}
				}
			});

			tab.children[0].children[0].classList.add(colors[currColor]);

			if(tab.classList.contains('is-active'))
			{
				if(parentLU === null || parentLU.classList.contains('is-active'))
				{
					document.getElementById('loader').style.display = 'none';
					populate(pages[i], reports[pages[i]]);
				}
			}
		}
	});

	Promise.all(promises);

	Object.keys(tabs).forEach((listIdx, ix) => {
		const tabList = tabs[listIdx].children[0].children;
		Object.keys(tabList).forEach((tab, ix) => {
			tabList[tab].addEventListener("click", (event) => changeActive(event.currentTarget));
		});
	});
});
