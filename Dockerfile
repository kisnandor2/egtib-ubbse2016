FROM node

COPY package.json /egtib/
WORKDIR /egtib
RUN npm install --only=production
COPY . /egtib/

CMD ["/egtib/start.sh"]
ENTRYPOINT ["bash"]